import { User } from '../models/User';
import { PointsLedger } from '../models/PointsLedger';
import { Badge } from '../models/Badge';
import { UserBadge } from '../models/UserBadge';
import { Challenge } from '../models/Challenge';
import { ChallengeEntry } from '../models/ChallengeEntry';
import mongoose from 'mongoose';

export class GamificationService {
  static async awardPoints(userId: string | mongoose.Types.ObjectId, amount: number, reason: string, refId?: string, refType?: string) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await PointsLedger.create([{
        userId,
        amount,
        reason,
        referenceId: refId,
        referenceType: refType
      }], { session });

      const user = await User.findById(userId).session(session);
      if (user) {
        user.points += amount;
        
        if (user.points > 1000) user.level = 'champion';
        else if (user.points > 500) user.level = 'advanced';
        else if (user.points > 100) user.level = 'intermediate';
        
        await user.save({ session });
      }

      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  static async checkBadges(userId: string) {
    const user = await User.findById(userId);
    if (!user) return;

    if (user.longestStreak >= 7) {
      await this.awardBadge(userId, 'streak_7');
    }
    if (user.longestStreak >= 30) {
      await this.awardBadge(userId, 'streak_30');
    }
  }

  static async awardBadge(userId: string, badgeKey: string) {
    const existing = await UserBadge.findOne({ userId, badgeKey });
    if (!existing) {
      await UserBadge.create({ userId, badgeKey });
    }
  }

  static async getLeaderboard(departmentId?: string) {
    const query: any = { role: 'staff', active: true };
    if (departmentId) query.departmentId = departmentId;

    const users = await User.find(query)
      .sort({ points: -1 })
      .limit(50)
      .populate('departmentId', 'name')
      .select('name points level currentStreak longestStreak');
    
    return users;
  }

  static async listActiveChallenges() {
    return await Challenge.find({ 
      active: true, 
      startDate: { $lte: new Date() }, 
      endDate: { $gte: new Date() } 
    });
  }
}
