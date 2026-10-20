import { Challenge } from '../models/Challenge';
import { ChallengeEntry } from '../models/ChallengeEntry';
import { User } from '../models/User';
import { NotificationService } from '../services/notificationService';
import { Role, NotificationType, Language } from '@shared/types';
import { startOfDay, endOfDay, addDays } from 'date-fns';

export class ChallengeNotificationsJob {
  /**
   * PRD Notify-02: Daily notification for challenges starting today or ending tomorrow
   */
  static async runChallengeNotifications() {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const tomorrowStart = startOfDay(addDays(now, 1));
    const tomorrowEnd = endOfDay(addDays(now, 1));

    let notificationsSent = 0;

    // 1. Challenges starting today
    const startingChallenges = await Challenge.find({
      active: true,
      startDate: { $gte: todayStart, $lte: todayEnd }
    });

    if (startingChallenges.length > 0) {
      const activeStaff = await User.find({ role: Role.Staff, active: true });
      for (const challenge of startingChallenges) {
        for (const staff of activeStaff) {
          const isMarathi = staff.language === Language.Marathi;
          const challengeTitle = isMarathi ? challenge.title.mr : challenge.title.en;
          const title = isMarathi ? 'नवीन आव्हान सुरू झाले! 🎯' : 'New Challenge Started! 🎯';
          const body = isMarathi
            ? `"${challengeTitle}" आव्हान सुरू झाले आहे. आजच सहभागी व्हा!`
            : `Challenge "${challengeTitle}" has started. Join today!`;

          await NotificationService.sendPush(staff._id, title, body, {
            type: NotificationType.ChallengeStarted,
            challengeId: challenge._id.toString()
          });

          await NotificationService.createInAppNotification(
            staff._id,
            NotificationType.ChallengeStarted,
            title,
            body,
            { challengeId: challenge._id.toString() }
          );

          notificationsSent++;
        }
      }
    }

    // 2. Challenges ending tomorrow
    const endingChallenges = await Challenge.find({
      active: true,
      endDate: { $gte: tomorrowStart, $lte: tomorrowEnd }
    });

    for (const challenge of endingChallenges) {
      const incompleteEntries = await ChallengeEntry.find({
        challengeId: challenge._id,
        completedAt: { $exists: false }
      }).populate('userId', 'language');

      for (const entry of incompleteEntries) {
        const user = entry.userId as any;
        if (!user) continue;

        const isMarathi = user.language === Language.Marathi;
        const challengeTitle = isMarathi ? challenge.title.mr : challenge.title.en;
        const title = isMarathi ? 'आव्हान लवकरच संपत आहे! ⏰' : 'Challenge Ending Soon! ⏰';
        const body = isMarathi
          ? `"${challengeTitle}" उद्या संपत आहे. तुमचे उद्दिष्ट पूर्ण करा!`
          : `Challenge "${challengeTitle}" ends tomorrow. Finish your goal!`;

        await NotificationService.sendPush(user._id, title, body, {
          type: NotificationType.ChallengeEnding,
          challengeId: challenge._id.toString()
        });

        await NotificationService.createInAppNotification(
          user._id,
          NotificationType.ChallengeEnding,
          title,
          body,
          { challengeId: challenge._id.toString() }
        );

        notificationsSent++;
      }
    }

    return notificationsSent;
  }
}
