import mongoose from 'mongoose';
import { User } from '../models/User';
import { ReadingLog } from '../models/ReadingLog';
import { UserBook } from '../models/UserBook';
import { Department } from '../models/Department';
import { Role, ProofOutcome, BookStatus } from '@shared/types';
import { getTodayDateString } from '../utils/dateUtils';

export class DashboardService {
  /**
   * PRD Admin-01: Administrator reading engagement dashboard
   */
  static async getDashboard() {
    const todayStr = getTodayDateString();

    const [
      totalStaff,
      activeStaff,
      todayLogs,
      staffUsers,
      proofReviewPending,
      departments,
      mostReadAgg
    ] = await Promise.all([
      User.countDocuments({ role: Role.Staff }),
      User.countDocuments({ role: Role.Staff, active: true }),
      ReadingLog.find({ date: todayStr }).populate('userId', 'name email departmentId').populate('bookId', 'title author'),
      User.find({ role: Role.Staff, active: true }).select('name departmentId currentStreak points'),
      ReadingLog.countDocuments({
        $or: [
          { 'proof.status': ProofOutcome.NeedsReview },
          { 'proof.spotCheck': true }
        ],
        'proof.adminDecision': { $exists: false }
      }),
      Department.find(),
      UserBook.aggregate([
        { $match: { status: { $in: [BookStatus.Reading, BookStatus.Finished] } } },
        {
          $group: {
            _id: '$bookId',
            readerCount: { $sum: 1 }
          }
        },
        { $sort: { readerCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: '_id',
            as: 'book'
          }
        },
        { $unwind: '$book' },
        {
          $project: {
            bookId: '$_id',
            title: '$book.title',
            author: '$book.author',
            coverUrl: '$book.coverUrl',
            readerCount: 1
          }
        }
      ])
    ]);

    // 1. Streak distribution buckets (0, 1-6, 7-13, 14-29, 30+)
    const streakBuckets = {
      zero: 0,
      oneToSix: 0,
      sevenToThirteen: 0,
      fourteenToTwentyNine: 0,
      thirtyPlus: 0
    };

    let totalStreakSum = 0;
    for (const staff of staffUsers) {
      const streak = staff.currentStreak || 0;
      totalStreakSum += streak;
      if (streak === 0) streakBuckets.zero++;
      else if (streak <= 6) streakBuckets.oneToSix++;
      else if (streak <= 13) streakBuckets.sevenToThirteen++;
      else if (streak <= 29) streakBuckets.fourteenToTwentyNine++;
      else streakBuckets.thirtyPlus++;
    }

    const averageStreak = staffUsers.length > 0 ? Number((totalStreakSum / staffUsers.length).toFixed(1)) : 0;

    // 2. Department comparison
    const deptStatsMap = new Map<string, { members: number; loggedToday: number; totalStreak: number; totalPoints: number }>();
    for (const d of departments) {
      deptStatsMap.set(d._id.toString(), { members: 0, loggedToday: 0, totalStreak: 0, totalPoints: 0 });
    }

    const loggedUserIds = new Set(todayLogs.map(l => l.userId?._id?.toString() || l.userId?.toString()));

    for (const s of staffUsers) {
      if (!s.departmentId) continue;
      const deptId = s.departmentId.toString();
      const stats = deptStatsMap.get(deptId);
      if (stats) {
        stats.members++;
        stats.totalStreak += s.currentStreak || 0;
        stats.totalPoints += s.points || 0;
        if (loggedUserIds.has(s._id.toString())) {
          stats.loggedToday++;
        }
      }
    }

    const departmentComparison = departments.map(d => {
      const stats = deptStatsMap.get(d._id.toString()) || { members: 0, loggedToday: 0, totalStreak: 0, totalPoints: 0 };
      return {
        departmentId: d._id,
        name: d.name,
        members: stats.members,
        loggedToday: stats.loggedToday,
        averageStreak: stats.members > 0 ? Number((stats.totalStreak / stats.members).toFixed(1)) : 0,
        totalPoints: stats.totalPoints
      };
    });

    return {
      staffStats: {
        totalStaff,
        activeStaff,
        loggedTodayCount: todayLogs.length,
        loggedTodayPercentage: activeStaff > 0 ? Math.round((todayLogs.length / activeStaff) * 100) : 0
      },
      todayLogs,
      streakDistribution: {
        buckets: streakBuckets,
        averageStreak
      },
      mostReadBooks: mostReadAgg,
      departmentComparison,
      proofReviewPending
    };
  }
}
