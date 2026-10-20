import { LeaderboardService } from '../services/leaderboardService';
import { Post } from '../models/Post';
import { User } from '../models/User';
import { NotificationService } from '../services/notificationService';
import { PostType, Role, NotificationType, Language } from '@shared/types';

export class ReaderOfMonthJob {
  /**
   * PRD Game-06: Automatically announce and post Reader of the Month on the 1st of each month
   */
  static async runReaderOfMonth() {
    const winner = await LeaderboardService.getReaderOfMonth();
    if (!winner) return null;

    // Check if post already created for this month
    const existingPost = await Post.findOne({
      type: PostType.Update,
      'title.en': { $regex: winner.month }
    });

    if (existingPost) return existingPost;

    // Admin who creates system announcement (or winner/first admin)
    const admin = await User.findOne({ role: { $in: [Role.Owner, Role.Admin] } });
    if (!admin) return null;

    const post = await Post.create({
      type: PostType.Update,
      title: {
        en: `🏆 Reader of the Month (${winner.month}): ${winner.name}`,
        mr: `🏆 महिन्याचे सर्वोत्कृष्ट वाचक (${winner.month}): ${winner.name}`
      },
      body: {
        en: `Congratulations to ${winner.name} for being named Reader of the Month with ${winner.points} points! Keep reading!`,
        mr: `अभिनंदन! ${winner.name} यांनी ${winner.points} गुणांसह या महिन्याचे सर्वोत्कृष्ट वाचक पद पटकावले आहे! असेच वाचन सुरू ठेवा!`
      },
      pinned: true,
      publishedAt: new Date(),
      createdBy: admin._id
    });

    // Notify all active staff members
    const allStaff = await User.find({ role: Role.Staff, active: true });
    for (const staff of allStaff) {
      const isMarathi = staff.language === Language.Marathi;
      const title = isMarathi ? '🏆 महिन्याचे सर्वोत्कृष्ट वाचक!' : '🏆 Reader of the Month!';
      const body = isMarathi
        ? `${winner.name} यांनी ${winner.points} गुणांसह बाजी मारली!`
        : `${winner.name} won Reader of the Month with ${winner.points} points!`;

      await NotificationService.sendPush(staff._id, title, body, {
        type: NotificationType.BadgeEarned,
        postId: post._id.toString()
      });

      await NotificationService.createInAppNotification(
        staff._id,
        NotificationType.BadgeEarned,
        title,
        body,
        { postId: post._id.toString() }
      );
    }

    return post;
  }
}
