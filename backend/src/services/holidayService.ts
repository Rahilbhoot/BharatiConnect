import mongoose from 'mongoose';
import { Holiday, IHoliday } from '../models/Holiday';
import { AuditLog } from '../models/AuditLog';
import { HolidayType } from '@shared/types';
import { NotFoundError, ValidationError, ConflictError } from '../utils/AppError';

export class HolidayService {
  /**
   * PRD Admin-07: Add organization holiday or staff-approved leave
   */
  static async addHoliday(
    date: string,
    name: { en: string; mr: string },
    type: HolidayType,
    userId: string | null | undefined,
    adminId: string
  ): Promise<IHoliday> {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ValidationError('Date must be in YYYY-MM-DD format');
    }
    if (!name?.en && !name?.mr) {
      throw new ValidationError('Holiday name must be provided in en or mr');
    }

    const existing = await Holiday.findOne({
      date,
      userId: userId ? new mongoose.Types.ObjectId(userId) : null
    });

    if (existing) {
      throw new ConflictError('A holiday or leave entry already exists for this date and user');
    }

    const holiday = await Holiday.create({
      date,
      name: {
        en: name.en || name.mr,
        mr: name.mr || name.en
      },
      type,
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined
    });

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(adminId),
      action: 'ADD_HOLIDAY',
      targetType: 'Holiday',
      targetId: holiday._id,
      after: holiday.toObject()
    });

    return holiday;
  }

  /**
   * PRD Admin-07: List organization holidays and leaves
   */
  static async listHolidays(year?: number, month?: number) {
    const filter: any = {};

    if (year && month) {
      const monthStr = String(month).padStart(2, '0');
      filter.date = { $regex: `^${year}-${monthStr}` };
    } else if (year) {
      filter.date = { $regex: `^${year}-` };
    }

    return await Holiday.find(filter)
      .sort({ date: 1 })
      .populate('userId', 'name email departmentId');
  }

  /**
   * Remove a holiday or leave entry
   */
  static async removeHoliday(id: string | mongoose.Types.ObjectId, adminId: string) {
    const holiday = await Holiday.findById(id);
    if (!holiday) throw new NotFoundError('Holiday entry not found');

    const before = holiday.toObject();
    await Holiday.findByIdAndDelete(id);

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(adminId),
      action: 'REMOVE_HOLIDAY',
      targetType: 'Holiday',
      targetId: new mongoose.Types.ObjectId(id),
      before
    });

    return { message: 'Holiday removed successfully' };
  }

  /**
   * Check if a given date is an excused day (org-wide holiday or staff leave)
   */
  static async isExcusedDay(userId: string | mongoose.Types.ObjectId, date: string): Promise<boolean> {
    const entry = await Holiday.findOne({
      date,
      $or: [
        { userId: null },
        { userId: { $exists: false } },
        { userId: new mongoose.Types.ObjectId(userId) }
      ]
    });
    return !!entry;
  }
}
