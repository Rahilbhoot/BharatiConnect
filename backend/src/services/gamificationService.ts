import mongoose from 'mongoose';
import { User } from '../models/User';
import { PointsLedger } from '../models/PointsLedger';
import { UserBadge } from '../models/UserBadge';
import { ReadingLog } from '../models/ReadingLog';
import { UserBook } from '../models/UserBook';
import { Book } from '../models/Book';
import { Challenge } from '../models/Challenge';
import { BookStatus } from '@shared/types';
import { getISOWeekString, getTodayDateString } from '../utils/dateUtils';
import { parseISO, startOfMonth } from 'date-fns';

export class GamificationService {
  /**
   * PRD Section 8: Level calculation
   * Beginner Reader: 0
   * Page Turner: 100
   * Bookworm: 500
   * Scholar: 1,500
   * Library Guardian: 4,000
   */
  static calculateLevel(totalPoints: number): string {
    if (totalPoints >= 4000) return 'library_guardian';
    if (totalPoints >= 1500) return 'scholar';
    if (totalPoints >= 500) return 'bookworm';
    if (totalPoints >= 100) return 'page_turner';
    return 'beginner';
  }

  static async awardPoints(
    userId: string | mongoose.Types.ObjectId,
    amount: number,
    reason: string,
    refId?: string,
    refType?: string
  ) {
    try {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        await PointsLedger.create(
          [{
            userId,
            amount,
            reason,
            referenceId: refId,
            referenceType: refType
          }],
          { session }
        );

        const user = await User.findById(userId).session(session);
        if (user) {
          user.points = Math.max(0, (user.points || 0) + amount);
          user.level = this.calculateLevel(user.points);
          await user.save({ session });
        }

        await session.commitTransaction();
      } catch (innerErr) {
        await session.abortTransaction();
        throw innerErr;
      } finally {
        session.endSession();
      }
    } catch (err: any) {
      if (err?.message && (err.message.includes('replica set') || err.message.includes('Transaction numbers'))) {
        await PointsLedger.create([{
          userId,
          amount,
          reason,
          referenceId: refId,
          referenceType: refType
        }]);
        const user = await User.findById(userId);
        if (user) {
          user.points = Math.max(0, (user.points || 0) + amount);
          user.level = this.calculateLevel(user.points);
          await user.save();
        }
      } else {
        throw err;
      }
    }

    // Check badges after points awarded
    await this.checkBadges(userId);
  }

  /**
   * PRD Section 8: Badges
   * First Page, 7-Day Streak, 30-Day Streak, Book Finisher, Early Bird, Marathi Reader, Comeback
   */
  static async checkBadges(userId: string | mongoose.Types.ObjectId) {
    const user = await User.findById(userId);
    if (!user) return;

    const uId = new mongoose.Types.ObjectId(userId);

    // 1. first_page: has >= 1 reading log
    const logCount = await ReadingLog.countDocuments({
      userId: uId,
      'proof.adminDecision': { $ne: 'rejected' }
    });
    if (logCount >= 1) {
      await this.awardBadge(uId, 'first_page');
    }

    // 2. streak_7
    if ((user.currentStreak || 0) >= 7 || (user.longestStreak || 0) >= 7) {
      await this.awardBadge(uId, 'streak_7');
    }

    // 3. streak_30
    if ((user.currentStreak || 0) >= 30 || (user.longestStreak || 0) >= 30) {
      await this.awardBadge(uId, 'streak_30');
    }

    // 4. book_finisher: finished >= 1 book
    const finishedCount = await UserBook.countDocuments({
      userId: uId,
      status: BookStatus.Finished
    });
    if (finishedCount >= 1) {
      await this.awardBadge(uId, 'book_finisher');
    }

    // 5. early_bird: >= 5 reading logs created before 09:00 IST
    const earlyLogs = await ReadingLog.countDocuments({
      userId: uId,
      'proof.adminDecision': { $ne: 'rejected' },
      $expr: {
        $lt: [
          { $hour: { date: '$createdAt', timezone: 'Asia/Kolkata' } },
          9
        ]
      }
    });
    if (earlyLogs >= 5) {
      await this.awardBadge(uId, 'early_bird');
    }

    // 6. marathi_reader: finished a Marathi book
    const finishedBooks = await UserBook.find({
      userId: uId,
      status: BookStatus.Finished
    }).select('bookId');

    if (finishedBooks.length > 0) {
      const marathiBookCount = await Book.countDocuments({
        _id: { $in: finishedBooks.map(fb => fb.bookId) },
        language: 'mr'
      });
      if (marathiBookCount >= 1) {
        await this.awardBadge(uId, 'marathi_reader');
      }
    }

    // 7. comeback: reached 7-day streak after having a previous broken streak
    if ((user.currentStreak || 0) >= 7) {
      if ((user.longestStreak || 0) > (user.currentStreak || 0) || logCount > (user.currentStreak || 0)) {
        await this.awardBadge(uId, 'comeback');
      }
    }
  }

  static async awardBadge(userId: string | mongoose.Types.ObjectId, badgeKey: string) {
    const existing = await UserBadge.findOne({ userId, badgeKey });
    if (!existing) {
      await UserBadge.create({ userId, badgeKey, earnedAt: new Date() });
    }
  }

  /**
   * Leaderboard supporting period (weekly/monthly) and scope (department/individual)
   */
  static async getLeaderboard(options?: {
    period?: 'weekly' | 'monthly';
    scope?: 'department' | 'individual';
    departmentId?: string;
    requestingUserId?: string;
  } | string) {
    // Support legacy call signature: getLeaderboard(departmentId)
    let departmentId: string | undefined;
    let period: 'weekly' | 'monthly' = 'weekly';
    let scope: 'department' | 'individual' = 'individual';
    let requestingUserId: string | undefined;

    if (typeof options === 'string') {
      departmentId = options;
    } else if (options) {
      period = options.period || 'weekly';
      scope = options.scope || 'individual';
      departmentId = options.departmentId;
      requestingUserId = options.requestingUserId;
    }

    // Determine date range for period
    let startDate: Date;
    const now = new Date();
    if (period === 'monthly') {
      startDate = startOfMonth(now);
    } else {
      // Weekly: start from Monday of current ISO week
      const day = now.getDay(); // 0 is Sunday
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      startDate = new Date(now);
      startDate.setDate(now.getDate() + diffToMonday);
      startDate.setHours(0, 0, 0, 0);
    }

    if (scope === 'department') {
      // Aggregate points by department for period
      const deptPoints = await PointsLedger.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        { $match: { 'user.active': true, 'user.role': 'staff', 'user.departmentId': { $exists: true } } },
        {
          $group: {
            _id: '$user.departmentId',
            totalPoints: { $sum: '$amount' },
            memberCount: { $addToSet: '$user._id' }
          }
        },
        {
          $lookup: {
            from: 'departments',
            localField: '_id',
            foreignField: '_id',
            as: 'department'
          }
        },
        { $unwind: '$department' },
        {
          $project: {
            departmentId: '$_id',
            departmentName: '$department.name',
            totalPoints: 1,
            activeMembers: { $size: '$memberCount' }
          }
        },
        { $sort: { totalPoints: -1 } }
      ]);
      return deptPoints;
    }

    // Individual scope: top 10 + requesting user rank
    const matchUser: any = { role: 'staff', active: true };
    if (departmentId) matchUser.departmentId = new mongoose.Types.ObjectId(departmentId);

    // Aggregate points in period
    const aggregated = await PointsLedger.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$userId',
          periodPoints: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $match: { 'user.role': 'staff', 'user.active': true } },
      ...(departmentId ? [{ $match: { 'user.departmentId': new mongoose.Types.ObjectId(departmentId) } }] : []),
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          points: '$periodPoints',
          totalPoints: '$user.points',
          level: '$user.level',
          currentStreak: '$user.currentStreak',
          longestStreak: '$user.longestStreak',
          departmentId: '$user.departmentId'
        }
      },
      { $sort: { points: -1 } }
    ]);

    // Top 10
    const top10 = aggregated.slice(0, 10).map((u, idx) => ({ ...u, rank: idx + 1 }));

    // User's own rank
    let userRank: any = null;
    if (requestingUserId) {
      const userIndex = aggregated.findIndex(u => String(u.userId) === String(requestingUserId));
      if (userIndex !== -1) {
        userRank = { ...aggregated[userIndex], rank: userIndex + 1 };
      }
    }

    return {
      period,
      scope,
      leaderboard: top10,
      userRank
    };
  }

  static async listActiveChallenges() {
    return await Challenge.find({
      active: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });
  }
}
