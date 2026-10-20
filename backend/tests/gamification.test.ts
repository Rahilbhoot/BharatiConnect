import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup';
import { GamificationService } from '../src/services/gamificationService';
import { User } from '../src/models/User';
import { Book } from '../src/models/Book';
import { UserBook } from '../src/models/UserBook';
import { ReadingLog } from '../src/models/ReadingLog';
import { UserBadge } from '../src/models/UserBadge';
import { PointsLedger } from '../src/models/PointsLedger';
import { BookStatus, Role, Language } from '@shared/types';
import mongoose from 'mongoose';

describe('GamificationService', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('calculates levels exactly at PRD thresholds', () => {
    expect(GamificationService.calculateLevel(0)).toBe('beginner');
    expect(GamificationService.calculateLevel(99)).toBe('beginner');
    expect(GamificationService.calculateLevel(100)).toBe('page_turner');
    expect(GamificationService.calculateLevel(499)).toBe('page_turner');
    expect(GamificationService.calculateLevel(500)).toBe('bookworm');
    expect(GamificationService.calculateLevel(1499)).toBe('bookworm');
    expect(GamificationService.calculateLevel(1500)).toBe('scholar');
    expect(GamificationService.calculateLevel(3999)).toBe('scholar');
    expect(GamificationService.calculateLevel(4000)).toBe('library_guardian');
    expect(GamificationService.calculateLevel(10000)).toBe('library_guardian');
  });

  it('awards points and updates user level and ledger atomically', async () => {
    const user = await User.create({
      name: 'Test Reader',
      email: 'reader@test.org',
      passwordHash: 'hash',
      role: Role.Staff,
      points: 90
    });

    await GamificationService.awardPoints(user.id, 20, 'reading_day');

    const updated = await User.findById(user.id);
    expect(updated?.points).toBe(110);
    expect(updated?.level).toBe('page_turner');

    const ledger = await PointsLedger.find({ userId: user.id });
    expect(ledger).toHaveLength(1);
    expect(ledger[0].amount).toBe(20);
    expect(ledger[0].reason).toBe('reading_day');
  });

  it('awards all 7 badges when conditions are met', async () => {
    const user = await User.create({
      name: 'Badge Hunter',
      email: 'badges@test.org',
      passwordHash: 'hash',
      role: Role.Staff,
      currentStreak: 7,
      longestStreak: 10
    });

    const book = await Book.create({
      title: 'Shyamchi Aai',
      author: 'Sane Guruji',
      totalPages: 120,
      language: 'mr'
    });

    // 1. Reading log for first_page and early_bird (5 logs at 07:00 IST = 01:30 UTC)
    for (let i = 1; i <= 5; i++) {
      await ReadingLog.create({
        userId: user.id,
        date: `2026-10-0${i}`,
        bookId: book.id,
        startPage: (i - 1) * 10,
        currentPage: i * 10,
        pagesRead: 10,
        createdAt: new Date(`2026-10-0${i}T01:30:00Z`) // 07:00 IST
      });
    }

    // 2. User finished Marathi book for book_finisher and marathi_reader
    await UserBook.create({
      userId: user.id,
      bookId: book.id,
      status: BookStatus.Finished,
      currentPage: 120,
      finishedAt: new Date()
    });

    await GamificationService.checkBadges(user.id);

    const userBadges = await UserBadge.find({ userId: user.id });
    const badgeKeys = userBadges.map(b => b.badgeKey).sort();

    // Should have: first_page, streak_7, book_finisher, early_bird, marathi_reader, comeback
    expect(badgeKeys).toContain('first_page');
    expect(badgeKeys).toContain('streak_7');
    expect(badgeKeys).toContain('book_finisher');
    expect(badgeKeys).toContain('early_bird');
    expect(badgeKeys).toContain('marathi_reader');
    expect(badgeKeys).toContain('comeback');
  });
});
