import mongoose from 'mongoose';
import { User } from '../models/User';
import { ReadingLog } from '../models/ReadingLog';
import { UserBook } from '../models/UserBook';
import { Role, BookStatus } from '@shared/types';

export class ReportsService {
  /**
   * PRD Admin-08: Get reading report for a date range
   */
  static async getReadingReport(
    startDate: string,
    endDate: string,
    departmentId?: string
  ) {
    const userQuery: any = { role: Role.Staff, active: true };
    if (departmentId) {
      userQuery.departmentId = new mongoose.Types.ObjectId(departmentId);
    }

    const staffList = await User.find(userQuery)
      .populate('departmentId', 'name')
      .select('name email departmentId currentStreak longestStreak points');

    const staffIds = staffList.map(s => s._id);

    // Reading logs in range
    const logs = await ReadingLog.find({
      userId: { $in: staffIds },
      date: { $gte: startDate, $lte: endDate },
      'proof.adminDecision': { $ne: 'rejected' }
    });

    // Books finished in range
    const startD = new Date(startDate);
    const endD = new Date(endDate);
    endD.setHours(23, 59, 59, 999);

    const finishedBooks = await UserBook.find({
      userId: { $in: staffIds },
      status: BookStatus.Finished,
      finishedAt: { $gte: startD, $lte: endD }
    });

    const report = staffList.map(staff => {
      const staffLogs = logs.filter(l => l.userId.toString() === staff._id.toString());
      const pages = staffLogs.reduce((sum, l) => sum + (l.pagesRead || 0), 0);
      const finished = finishedBooks.filter(fb => fb.userId.toString() === staff._id.toString()).length;

      const deptName = (staff.departmentId as any)?.name;
      const department = typeof deptName === 'string' ? deptName : (deptName?.en || deptName?.mr || 'Unassigned');

      return {
        userId: staff._id,
        name: staff.name,
        email: staff.email,
        department,
        readingDays: staffLogs.length,
        pagesRead: pages,
        currentStreak: staff.currentStreak || 0,
        longestStreak: staff.longestStreak || 0,
        booksFinished: finished,
        points: staff.points || 0
      };
    });

    return {
      startDate,
      endDate,
      totalStaff: staffList.length,
      report
    };
  }

  /**
   * PRD Admin-08: Export report as CSV formatted string
   */
  static async exportReadingReport(
    startDate: string,
    endDate: string,
    departmentId?: string
  ): Promise<string> {
    const data = await this.getReadingReport(startDate, endDate, departmentId);

    const header = ['Name', 'Email', 'Department', 'Reading Days', 'Pages Read', 'Current Streak', 'Longest Streak', 'Books Finished', 'Points'];
    const rows = data.report.map(r => [
      `"${String(r.name).replace(/"/g, '""')}"`,
      `"${String(r.email || '').replace(/"/g, '""')}"`,
      `"${String(r.department || '').replace(/"/g, '""')}"`,
      r.readingDays,
      r.pagesRead,
      r.currentStreak,
      r.longestStreak,
      r.booksFinished,
      r.points
    ]);

    return [header.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}
