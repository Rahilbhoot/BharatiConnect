import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup';
import { ReadingService } from '../src/services/readingService';
import { User } from '../src/models/User';
import { Book } from '../src/models/Book';
import { UserBook } from '../src/models/UserBook';
import { ReadingLog } from '../src/models/ReadingLog';
import { Settings } from '../src/models/Settings';
import { BookStatus, Role } from '@shared/types';
import { getTodayDateString } from '../src/utils/dateUtils';
import { ValidationError } from '../src/utils/AppError';

describe('ReadingService', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await Settings.create({ minimumPages: 2 });
  });

  it('calculates pagesRead from userBook.currentPage and upserts check-in', async () => {
    const user = await User.create({
      name: 'Reading User',
      email: 'reader1@test.org',
      passwordHash: 'hash',
      role: Role.Staff
    });

    const book = await Book.create({
      title: 'Wings of Fire',
      author: 'A.P.J. Abdul Kalam',
      totalPages: 180,
      language: 'en'
    });

    await UserBook.create({
      userId: user.id,
      bookId: book.id,
      status: BookStatus.Reading,
      currentPage: 20
    });

    // Check in at currentPage 35 -> pagesRead = 35 - 20 = 15
    const log = await ReadingService.checkIn(user.id, book.id, 35);

    expect(log.startPage).toBe(20);
    expect(log.currentPage).toBe(35);
    expect(log.pagesRead).toBe(15);
    expect(log.date).toBe(getTodayDateString());

    const updatedUserBook = await UserBook.findOne({ userId: user.id, bookId: book.id });
    expect(updatedUserBook?.currentPage).toBe(35);

    // Second check-in on the same day: upserts rather than failing with duplicate error
    const updatedLog = await ReadingService.checkIn(user.id, book.id, 45);
    expect(updatedLog._id.toString()).toBe(log._id.toString());
    expect(updatedLog.currentPage).toBe(45);
    expect(updatedLog.pagesRead).toBe(25); // 45 - 20
  });

  it('rejects check-in if currentPage exceeds book.totalPages', async () => {
    const user = await User.create({
      name: 'Exceeding User',
      email: 'exceed@test.org',
      passwordHash: 'hash',
      role: Role.Staff
    });

    const book = await Book.create({
      title: 'Short Story',
      author: 'Author',
      totalPages: 50,
      language: 'mr'
    });

    await UserBook.create({
      userId: user.id,
      bookId: book.id,
      status: BookStatus.Reading,
      currentPage: 10
    });

    await expect(ReadingService.checkIn(user.id, book.id, 55)).rejects.toThrow(ValidationError);
  });

  it('rejects check-in if pagesRead is less than settings.minimumPages', async () => {
    const user = await User.create({
      name: 'Slow Reader',
      email: 'slow@test.org',
      passwordHash: 'hash',
      role: Role.Staff
    });

    const book = await Book.create({
      title: 'Long Book',
      author: 'Author',
      totalPages: 200,
      language: 'mr'
    });

    await UserBook.create({
      userId: user.id,
      bookId: book.id,
      status: BookStatus.Reading,
      currentPage: 10
    });

    // minimumPages is 2 in settings, reading 1 page should reject
    await expect(ReadingService.checkIn(user.id, book.id, 11)).rejects.toThrow(ValidationError);
  });

  it('marks book as finished and awards 100 points when currentPage reaches totalPages', async () => {
    const user = await User.create({
      name: 'Finisher User',
      email: 'finisher@test.org',
      passwordHash: 'hash',
      role: Role.Staff,
      points: 0
    });

    const book = await Book.create({
      title: 'Final Chapter',
      author: 'Author',
      totalPages: 100,
      language: 'mr'
    });

    await UserBook.create({
      userId: user.id,
      bookId: book.id,
      status: BookStatus.Reading,
      currentPage: 90
    });

    await ReadingService.checkIn(user.id, book.id, 100);

    const updatedUserBook = await UserBook.findOne({ userId: user.id, bookId: book.id });
    expect(updatedUserBook?.status).toBe(BookStatus.Finished);
    expect(updatedUserBook?.finishedAt).toBeDefined();

    const updatedUser = await User.findById(user.id);
    // 10 points for reading day + 100 points for finished book = 110 points
    expect(updatedUser?.points).toBe(110);
    expect(updatedUser?.level).toBe('page_turner');
  });
});
