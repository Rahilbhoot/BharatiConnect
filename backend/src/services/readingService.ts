import mongoose from 'mongoose';
import crypto from 'crypto';
import { ReadingLog } from '../models/ReadingLog';
import { UserBook } from '../models/UserBook';
import { Book } from '../models/Book';
import { User } from '../models/User';
import { Settings } from '../models/Settings';
import { StreakFreeze } from '../models/StreakFreeze';
import { StreakService } from './streakService';
import { GamificationService } from './gamificationService';
import { getTodayDateString, getISOWeekString } from '../utils/dateUtils';
import { ProofMode, BookStatus, ProofOutcome } from '@shared/types';
import { ValidationError, NotFoundError } from '../utils/AppError';

export class ReadingService {
  /**
   * PRD Reading-03, Reading-04, Reading-07
   * Check in with bookId and currentPage.
   * Calculates pagesRead from previousPage on user's shelf.
   * Upserts for today's date.
   */
  static async checkIn(
    userId: string | mongoose.Types.ObjectId,
    bookId: string | mongoose.Types.ObjectId,
    currentPage: number,
    note?: string,
    file?: Express.Multer.File
  ) {
    // 1. Find book on user's shelf
    let userBook = await UserBook.findOne({ userId, bookId });
    if (!userBook) {
      throw new NotFoundError('Book not in your shelf');
    }

    if (userBook.status !== BookStatus.Reading) {
      if (userBook.status === BookStatus.WantToRead) {
        // Enforce max 3 concurrent reading books (PRD Reading-02)
        const readingCount = await UserBook.countDocuments({ userId, status: BookStatus.Reading });
        if (readingCount >= 3) {
          throw new ValidationError('You can only have up to 3 books in reading status at a time');
        }
        userBook.status = BookStatus.Reading;
        userBook.startedAt = new Date();
      } else {
        throw new ValidationError('Book must be in Reading status to check in');
      }
    }

    // 2. Validate against totalPages in Book
    const book = await Book.findById(bookId);
    if (!book) throw new NotFoundError('Book not found');
    if (currentPage > book.totalPages) {
      throw new ValidationError(`Page ${currentPage} exceeds total pages (${book.totalPages})`);
    }

    // 3. Today in IST
    const dateStr = getTodayDateString();

    // 4. Calculate pages read (accounting for same-day upsert per PRD Reading-04)
    const existingLog = await ReadingLog.findOne({ userId, date: dateStr });
    const startingPage = existingLog ? existingLog.startPage : (userBook.currentPage || 0);
    const pagesReadToday = currentPage - startingPage;

    const settings = await Settings.findOne();
    const minPages = settings?.minimumPages ?? 1;

    if (existingLog) {
      if (currentPage <= (existingLog.currentPage || userBook.currentPage || 0)) {
        throw new ValidationError(
          `Current page ${currentPage} must be greater than previous check-in page ${existingLog.currentPage}`
        );
      }
    } else {
      if (pagesReadToday < minPages) {
        throw new ValidationError(
          `Must read at least ${minPages} page(s). You went from page ${startingPage} to ${currentPage}.`
        );
      }
    }

    // 5. Handle proof requirements (PRD Section 7)
    let provisional = false;
    let proofData: any = undefined;

    if (settings?.proofMode === ProofMode.Required && !file) {
      throw new ValidationError('Photo proof is required');
    }

    if (file) {
      const imageHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
      const duplicate = await ReadingLog.findOne({ 'proof.imageHash': imageHash });
      if (duplicate && String(duplicate.userId) !== String(userId)) {
        throw new ValidationError('Duplicate photo detected. Please photograph the physical book page.');
      }

      provisional = true;
      proofData = {
        status: ProofOutcome.NeedsReview,
        imageHash,
        attempts: 1,
        spotCheck: Math.random() < (settings?.spotCheckRate ?? 0.05)
      };
    }

    // 6. UPSERT reading log (PRD Reading-04)
    const log = await ReadingLog.findOneAndUpdate(
      { userId, date: dateStr },
      {
        userId,
        date: dateStr,
        bookId,
        startPage: startingPage,
        currentPage,
        pagesRead: pagesReadToday,
        note: note || undefined,
        provisional,
        ...(proofData ? { proof: proofData } : {})
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 7. Update UserBook
    userBook.currentPage = currentPage;
    if (currentPage === book.totalPages) {
      userBook.status = BookStatus.Finished;
      userBook.finishedAt = new Date();
      await GamificationService.awardPoints(userId, 100, 'book_finished', String(book._id), 'Book');
    }
    await userBook.save();

    // 8. Update streak (Provisional days count immediately per PRD 6.9)
    await StreakService.calculateStreak(userId, dateStr);

    // 9. Award points (10 for reading day, only on first check-in of the day)
    if (!existingLog) {
      await GamificationService.awardPoints(userId, 10, 'reading_day', String(log._id), 'ReadingLog');
    }

    // 10. Check badges
    await GamificationService.checkBadges(userId);

    return log;
  }

  /**
   * Backwards compatible alias for logReading
   */
  static async logReading(
    userId: string,
    bookId: string,
    startPage: number,
    endPage: number,
    note?: string,
    file?: Express.Multer.File
  ) {
    return this.checkIn(userId, bookId, endPage, note, file);
  }

  /**
   * Get user streak info
   */
  static async getStreak(userId: string | mongoose.Types.ObjectId) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const displayStreak = await StreakService.getDisplayStreak(userId);
    const settings = await Settings.findOne();
    const allowedPerWeek = settings?.freezesPerWeek ?? 1;
    const currentWeek = getISOWeekString(getTodayDateString());
    const usedInWeek = await StreakFreeze.countDocuments({ userId, week: currentWeek });

    return {
      currentStreak: user.currentStreak || 0,
      displayStreak,
      longestStreak: user.longestStreak || 0,
      lastLogDate: user.lastLogDate,
      freezesPerWeek: allowedPerWeek,
      freezesUsedThisWeek: usedInWeek,
      freezesRemaining: Math.max(0, allowedPerWeek - usedInWeek)
    };
  }

  /**
   * Get user reading history
   */
  static async getHistory(
    userId: string | mongoose.Types.ObjectId,
    page = 1,
    limit = 30,
    month?: number,
    year?: number
  ) {
    const skip = (page - 1) * limit;
    const filter: any = { userId };
    if (month && year) {
      const monthStr = String(month).padStart(2, '0');
      filter.date = { $regex: `^${year}-${monthStr}` };
    }

    const [logs, total] = await Promise.all([
      ReadingLog.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .populate('bookId', 'title author coverUrl totalPages language'),
      ReadingLog.countDocuments(filter)
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Submit weekly takeaway (PRD Section 8: 20 points)
   */
  static async submitTakeaway(
    userId: string | mongoose.Types.ObjectId,
    bookId: string | mongoose.Types.ObjectId,
    text: string
  ) {
    if (!text || text.trim().length === 0) {
      throw new ValidationError('Takeaway text cannot be empty');
    }
    if (text.length > 280) {
      throw new ValidationError('Takeaway cannot exceed 280 characters');
    }

    const todayStr = getTodayDateString();
    let log = await ReadingLog.findOne({ userId, date: todayStr });

    if (log) {
      log.note = text.trim();
      await log.save();
    } else {
      // Create or update UserBook
      const userBook = await UserBook.findOne({ userId, bookId });
      if (userBook) {
        userBook.review = text.trim();
        await userBook.save();
      }
    }

    await GamificationService.awardPoints(
      userId,
      20,
      'weekly_takeaway',
      log?.id || String(bookId),
      'Takeaway'
    );

    return { message: 'Takeaway submitted successfully!', text: text.trim() };
  }
}
