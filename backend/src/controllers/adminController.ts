import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboardService';
import { SettingsService } from '../services/settingsService';
import { ReportsService } from '../services/reportsService';
import { AuditLogService } from '../services/auditLogService';
import { HolidayService } from '../services/holidayService';
import { PointsService } from '../services/pointsService';
import { StreakService } from '../services/streakService';
import { ReadingLog } from '../models/ReadingLog';
import { UserBook } from '../models/UserBook';
import { Book } from '../models/Book';
import { AuditLog } from '../models/AuditLog';
import { BookStatus } from '@shared/types';
import { NotFoundError, ValidationError } from '../utils/AppError';
import mongoose from 'mongoose';

export class AdminController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await DashboardService.getDashboard();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.getSettings();
      res.json(settings);
    } catch (err) {
      next(err);
    }
  }

  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.updateSettings(req.body, req.user!.id);
      res.json(settings);
    } catch (err) {
      next(err);
    }
  }

  static async getReadingReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end, dept, format } = req.query;
      const startDate = (start as string) || new Date().toISOString().slice(0, 10);
      const endDate = (end as string) || new Date().toISOString().slice(0, 10);

      if (format === 'csv') {
        const csv = await ReportsService.exportReadingReport(startDate, endDate, dept as string);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=reading-report-${startDate}-to-${endDate}.csv`);
        return res.send(csv);
      }

      const report = await ReportsService.getReadingReport(startDate, endDate, dept as string);
      res.json(report);
    } catch (err) {
      next(err);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const result = await AuditLogService.getAuditLogs(page, limit, {
        actorId: req.query.actor as string,
        action: req.query.action as string,
        targetType: req.query.targetType as string,
        startDate: req.query.from as string,
        endDate: req.query.to as string
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async addHoliday(req: Request, res: Response, next: NextFunction) {
    try {
      const { date, name, type, userId } = req.body;
      const holiday = await HolidayService.addHoliday(date, name, type, userId, req.user!.id);
      res.status(201).json(holiday);
    } catch (err) {
      next(err);
    }
  }

  static async listHolidays(req: Request, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const holidays = await HolidayService.listHolidays(year, month);
      res.json(holidays);
    } catch (err) {
      next(err);
    }
  }

  static async removeHoliday(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await HolidayService.removeHoliday(req.params.id, req.user!.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PRD Admin-10: Manually add a missed reading day for a staff member
   */
  static async addMissedDay(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, date, bookId, pagesRead, reason } = req.body;
      if (!reason || reason.trim().length === 0) {
        throw new ValidationError('A reason is required to manually add a missed reading day.');
      }

      const book = await Book.findById(bookId);
      if (!book) throw new NotFoundError('Book not found');

      let userBook = await UserBook.findOne({ userId, bookId });
      if (!userBook) {
        userBook = await UserBook.create({
          userId,
          bookId,
          status: BookStatus.Reading,
          currentPage: 0
        });
      }

      const startPage = userBook.currentPage || 0;
      const currentPage = startPage + Number(pagesRead);

      const log = await ReadingLog.findOneAndUpdate(
        { userId, date },
        {
          userId,
          date,
          bookId,
          startPage,
          currentPage,
          pagesRead: Number(pagesRead),
          note: `Admin added: ${reason}`,
          createdBy: new mongoose.Types.ObjectId(req.user!.id),
          provisional: false
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      userBook.currentPage = currentPage;
      if (currentPage >= book.totalPages) {
        userBook.status = BookStatus.Finished;
        userBook.finishedAt = new Date();
      }
      await userBook.save();

      // Award points
      await PointsService.awardPoints(userId, 10, 'admin_backfill_day', log.id, 'ReadingLog');

      // Recalculate streak chronologically
      await StreakService.recalculateFromLogs(userId);

      // Audit Log entry
      await AuditLog.create({
        actorId: new mongoose.Types.ObjectId(req.user!.id),
        action: 'ADMIN_ADD_MISSED_DAY',
        targetType: 'ReadingLog',
        targetId: log._id,
        after: log.toObject(),
        reason
      });

      res.status(201).json({ message: 'Missed reading day added successfully', log });
    } catch (err) {
      next(err);
    }
  }
}
