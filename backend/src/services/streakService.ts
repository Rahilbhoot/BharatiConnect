import mongoose from 'mongoose';
import { User } from '../models/User';
import { ReadingLog } from '../models/ReadingLog';
import { Holiday } from '../models/Holiday';
import { Settings } from '../models/Settings';
import { StreakFreeze } from '../models/StreakFreeze';
import { GamificationService } from './gamificationService';
import {
  differenceInDaysIST,
  getTodayDateString,
  yesterdayIST,
  getISOWeekString,
  dateRange,
  getNextDateString,
  getPreviousDateString
} from '../utils/dateUtils';

export class StreakService {
  /**
   * Check if a given date is an excused day (org-wide holiday or user leave)
   */
  static async isExcusedDay(userId: string | mongoose.Types.ObjectId, dateStr: string): Promise<boolean> {
    const holiday = await Holiday.findOne({
      date: dateStr,
      $or: [
        { userId: null },
        { userId: { $exists: false } },
        { userId: new mongoose.Types.ObjectId(userId) }
      ]
    });
    return !!holiday;
  }

  /**
   * Consume a freeze for a missed day if within weekly limit
   */
  static async consumeFreeze(userId: string | mongoose.Types.ObjectId, dateStr: string): Promise<boolean> {
    const existing = await StreakFreeze.findOne({ userId, date: dateStr });
    if (existing) return true;

    const settings = await Settings.findOne();
    const allowedPerWeek = settings?.freezesPerWeek ?? 1;

    const week = getISOWeekString(dateStr);
    const usedInWeek = await StreakFreeze.countDocuments({ userId, week });

    if (usedInWeek < allowedPerWeek) {
      await StreakFreeze.create({ userId, date: dateStr, week });
      return true;
    }
    return false;
  }

  /**
   * Calculate / update streak after a check-in on dateStr
   */
  static async calculateStreak(userId: string | mongoose.Types.ObjectId, dateStr: string) {
    const user = await User.findById(userId);
    if (!user) return null;

    if (!user.lastLogDate) {
      user.currentStreak = 1;
      user.longestStreak = Math.max(user.longestStreak || 0, 1);
      user.lastLogDate = dateStr;
    } else if (user.lastLogDate === dateStr) {
      // Repeat check-in on the same day: no change to streak length
      return user;
    } else {
      const diff = differenceInDaysIST(dateStr, user.lastLogDate);
      if (diff === 1) {
        // Consecutive day
        user.currentStreak += 1;
      } else if (diff > 1) {
        // There is a gap. Check each missing day between lastLogDate and dateStr
        const gapDays = dateRange(
          getNextDateString(user.lastLogDate),
          getPreviousDateString(dateStr)
        );

        let streakAlive = true;
        for (const day of gapDays) {
          const excused = await this.isExcusedDay(userId, day);
          if (excused) {
            continue; // Excused days keep streak alive without incrementing
          }
          const frozen = await this.consumeFreeze(userId, day);
          if (frozen) {
            continue; // Freeze covers the day
          }
          streakAlive = false;
          break;
        }

        if (streakAlive) {
          user.currentStreak += 1;
        } else {
          user.currentStreak = 1; // Streak broken, restart with today
        }
      } else {
        // Log is in the past (e.g. admin backfill) -> recalculate entire streak
        return await this.recalculateFromLogs(userId);
      }

      if (user.currentStreak > user.longestStreak) {
        user.longestStreak = user.currentStreak;
      }
      user.lastLogDate = dateStr;
    }

    await user.save();

    // Check streak milestone points (PRD Section 8)
    if (user.currentStreak === 7) {
      await GamificationService.awardPoints(userId, 50, 'streak_7', dateStr, 'Streak');
    } else if (user.currentStreak === 30) {
      await GamificationService.awardPoints(userId, 200, 'streak_30', dateStr, 'Streak');
    } else if (user.currentStreak === 100) {
      await GamificationService.awardPoints(userId, 500, 'streak_100', dateStr, 'Streak');
    }

    return user;
  }

  /**
   * Real-time display streak: if lastLogDate earlier than yesterday and gap not covered, returns 0.
   */
  static async getDisplayStreak(userId: string | mongoose.Types.ObjectId): Promise<number> {
    const user = await User.findById(userId);
    if (!user || !user.lastLogDate || user.currentStreak === 0) return 0;

    const today = getTodayDateString();
    const yesterday = yesterdayIST();

    if (user.lastLogDate === today || user.lastLogDate === yesterday) {
      return user.currentStreak;
    }

    // Gap between user.lastLogDate and yesterday
    const gapDays = dateRange(getNextDateString(user.lastLogDate), yesterday);
    for (const day of gapDays) {
      const excused = await this.isExcusedDay(userId, day);
      if (excused) continue;

      const frozen = await StreakFreeze.findOne({ userId, date: day });
      if (frozen) continue;

      // Check if a freeze can cover it
      const settings = await Settings.findOne();
      const allowedPerWeek = settings?.freezesPerWeek ?? 1;
      const week = getISOWeekString(day);
      const usedInWeek = await StreakFreeze.countDocuments({ userId, week });
      if (usedInWeek < allowedPerWeek) continue;

      // Uncovered missed day: display streak breaks
      return 0;
    }

    return user.currentStreak;
  }

  /**
   * Recalculate streak from scratch from chronological ReadingLogs.
   * Useful when an admin rejects a provisional log or removes a log.
   */
  static async recalculateFromLogs(userId: string | mongoose.Types.ObjectId) {
    const user = await User.findById(userId);
    if (!user) return null;

    // Reset consumed freezes during recalculation
    await StreakFreeze.deleteMany({ userId });

    const logs = await ReadingLog.find({
      userId,
      'proof.adminDecision': { $ne: 'rejected' }
    }).sort({ date: 1 });

    if (logs.length === 0) {
      user.currentStreak = 0;
      user.longestStreak = 0;
      user.lastLogDate = undefined;
      await user.save();
      return user;
    }

    // Unique dates sorted
    const uniqueDates = Array.from(new Set(logs.map(l => l.date))).sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let lastLogDate = '';

    for (const logDate of uniqueDates) {
      if (!lastLogDate) {
        currentStreak = 1;
        longestStreak = 1;
        lastLogDate = logDate;
      } else {
        const diff = differenceInDaysIST(logDate, lastLogDate);
        if (diff === 1) {
          currentStreak += 1;
        } else if (diff > 1) {
          const gapDays = dateRange(
            getNextDateString(lastLogDate),
            getPreviousDateString(logDate)
          );

          let streakAlive = true;
          for (const day of gapDays) {
            const excused = await this.isExcusedDay(userId, day);
            if (excused) continue;

            const frozen = await this.consumeFreeze(userId, day);
            if (frozen) continue;

            streakAlive = false;
            break;
          }

          if (streakAlive) {
            currentStreak += 1;
          } else {
            currentStreak = 1;
          }
        }

        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
        lastLogDate = logDate;
      }
    }

    user.currentStreak = currentStreak;
    // PRD 6.10: longestStreak is never reduced unless the removed day was part of it
    user.longestStreak = longestStreak;
    user.lastLogDate = lastLogDate;
    await user.save();

    return user;
  }
}
