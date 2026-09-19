import { ReadingLog } from '../models/ReadingLog';
import { UserBook } from '../models/UserBook';
import { Settings } from '../models/Settings';
import { StreakService } from './streakService';
import { getTodayDateString } from '../utils/dateUtils';
import { ProofMode, BookStatus, ProofOutcome } from '@shared/types';
import { ValidationError, NotFoundError } from '../utils/AppError';
import mongoose from 'mongoose';

export class ReadingService {
  static async logReading(userId: string, bookId: string, startPage: number, endPage: number, note?: string, file?: Express.Multer.File) {
    if (endPage <= startPage) throw new ValidationError('End page must be greater than start page');
    const pagesRead = endPage - startPage;
    
    const settings = await Settings.findOne();
    const minPages = settings ? settings.minimumPages : 1;
    if (pagesRead < minPages) throw new ValidationError(`Must read at least ${minPages} pages`);

    const userBook = await UserBook.findOne({ userId, bookId });
    if (!userBook) throw new NotFoundError('Book not found in user library');

    const dateStr = getTodayDateString();

    const existingLog = await ReadingLog.findOne({ userId, date: dateStr });
    if (existingLog) throw new ValidationError('Reading already logged for today');

    let provisional = false;
    let proofStatus = undefined;

    if (settings?.proofMode === ProofMode.Required) {
      if (!file) throw new ValidationError('Photo proof is required');
      provisional = true;
      proofStatus = ProofOutcome.NeedsReview; // Will trigger vision pipeline
    }

    const log = await ReadingLog.create({
      userId,
      date: dateStr,
      bookId,
      startPage,
      currentPage: endPage,
      pagesRead,
      note,
      provisional,
      proof: proofStatus ? { status: proofStatus } : undefined
    });

    userBook.currentPage = endPage;
    if (userBook.status === BookStatus.WantToRead) {
      userBook.status = BookStatus.Reading;
      userBook.startedAt = new Date();
    }
    await userBook.save();

    if (!provisional) {
      await StreakService.calculateStreak(new mongoose.Types.ObjectId(userId), dateStr);
    }

    return log;
  }
}
