import mongoose from 'mongoose';
import { PointsLedger } from '../models/PointsLedger';
import { User } from '../models/User';
import { startOfMonth, subMonths } from 'date-fns';

export class LeaderboardService {
  /**
   * Helper to determine period start date in Asia/Kolkata
   */
  private static getPeriodStartDate(period: 'weekly' | 'monthly'): Date {
    const now = new Date();
    if (period === 'monthly') {
      return startOfMonth(now);
    }
    // Monday of current ISO week
    const day = now.getDay(); // 0 is Sun, 1 is Mon
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  /**
   * PRD Game-04: Department Leaderboard
   */
  static async getDepartmentLeaderboard(period: 'weekly' | 'monthly' = 'weekly') {
    const startDate = this.getPeriodStartDate(period);

    return await PointsLedger.aggregate([
      { $match: { createdAt: { $gte: startDate }, amount: { $gt: 0 } } },
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
          name: '$department.name',
          totalPoints: 1,
          memberCount: { $size: '$memberCount' }
        }
      },
      { $sort: { totalPoints: -1 } }
    ]);
  }

  /**
   * PRD Game-04: Individual Leaderboard
   * Returns top 10 + requesting user's rank (never reveals bottom ranks)
   */
  static async getIndividualLeaderboard(
    period: 'weekly' | 'monthly' = 'weekly',
    requestingUserId?: string,
    departmentId?: string
  ) {
    const startDate = this.getPeriodStartDate(period);

    const pipeline: any[] = [
      { $match: { createdAt: { $gte: startDate }, amount: { $gt: 0 } } },
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
      { $match: { 'user.active': true, 'user.role': 'staff' } }
    ];

    if (departmentId) {
      pipeline.push({
        $match: { 'user.departmentId': new mongoose.Types.ObjectId(departmentId) }
      });
    }

    pipeline.push(
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
    );

    const allRanked = await PointsLedger.aggregate(pipeline);

    // Top 10
    const top10 = allRanked.slice(0, 10).map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));

    // Requesting user rank
    let userRank: any = null;
    if (requestingUserId) {
      const idx = allRanked.findIndex(r => String(r.userId) === String(requestingUserId));
      if (idx !== -1) {
        userRank = { ...allRanked[idx], rank: idx + 1 };
      } else {
        // User has not logged in this period
        const u = await User.findById(requestingUserId);
        if (u) {
          userRank = {
            userId: u._id,
            name: u.name,
            points: 0,
            totalPoints: u.points,
            level: u.level,
            currentStreak: u.currentStreak,
            longestStreak: u.longestStreak,
            rank: allRanked.length + 1
          };
        }
      }
    }

    return {
      period,
      top10,
      userRank
    };
  }

  /**
   * PRD Game-06: Reader of the Month for the previous calendar month
   */
  static async getReaderOfMonth() {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));

    const winners = await PointsLedger.aggregate([
      {
        $match: {
          createdAt: { $gte: prevMonthStart, $lt: currentMonthStart },
          amount: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$amount' }
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
      { $match: { 'user.active': true, 'user.role': 'staff' } },
      { $sort: { totalPoints: -1 } },
      { $limit: 1 }
    ]);

    if (winners.length === 0) return null;

    const winner = winners[0];
    return {
      userId: winner._id,
      name: winner.user.name,
      departmentId: winner.user.departmentId,
      points: winner.totalPoints,
      level: winner.user.level,
      month: prevMonthStart.toISOString().slice(0, 7) // 'YYYY-MM'
    };
  }
}
