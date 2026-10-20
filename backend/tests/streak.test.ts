import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup';
import { StreakService } from '../src/services/streakService';
import { User } from '../src/models/User';
import { Holiday } from '../src/models/Holiday';
import { Settings } from '../src/models/Settings';
import { ReadingLog } from '../src/models/ReadingLog';
import { Book } from '../src/models/Book';
import { StreakFreeze } from '../src/models/StreakFreeze';
import { HolidayType, Role } from '@shared/types';
import { getTodayDateString, yesterdayIST } from '../src/utils/dateUtils';
import mongoose from 'mongoose';

describe('StreakService', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await Settings.create({ freezesPerWeek: 1 });
  });

  it('starts streak at 1 on first check-in', async () => {
    const user = await User.create({
      name: 'Streak Tester',
      email: 'streak1@test.org',
      passwordHash: 'hash',
      role: Role.Staff
    });

    const updated = await StreakService.calculateStreak(user.id, '2026-10-01');
    expect(updated?.currentStreak).toBe(1);
    expect(updated?.longestStreak).toBe(1);
    expect(updated?.lastLogDate).toBe('2026-10-01');
  });

  it('increments streak on consecutive day', async () => {
    const user = await User.create({
      name: 'Streak Tester',
      email: 'streak2@test.org',
      passwordHash: 'hash',
      role: Role.Staff,
      currentStreak: 1,
      longestStreak: 1,
      lastLogDate: '2026-10-01'
    });

    const updated = await StreakService.calculateStreak(user.id, '2026-10-02');
    expect(updated?.currentStreak).toBe(2);
    expect(updated?.longestStreak).toBe(2);
    expect(updated?.lastLogDate).toBe('2026-10-02');
  });

  it('does not increment streak on duplicate check-in on the same day', async () => {
    const user = await User.create({
      name: 'Streak Tester',
      email: 'streak3@test.org',
      passwordHash: 'hash',
      role: Role.Staff,
      currentStreak: 2,
      longestStreak: 2,
      lastLogDate: '2026-10-02'
    });

    const updated = await StreakService.calculateStreak(user.id, '2026-10-02');
    expect(updated?.currentStreak).toBe(2);
    expect(updated?.longestStreak).toBe(2);
  });

  it('keeps streak alive across organization holiday without incrementing for the holiday', async () => {
    const user = await User.create({
      name: 'Streak Tester',
      email: 'streak4@test.org',
      passwordHash: 'hash',
      role: Role.Staff,
      currentStreak: 2,
      longestStreak: 2,
      lastLogDate: '2026-10-01'
    });

    // 2026-10-02 is an org-wide holiday (e.g. Gandhi Jayanti)
    await Holiday.create({
      date: '2026-10-02',
      name: { en: 'Gandhi Jayanti', mr: 'गांधी जयंती' },
      type: HolidayType.Holiday
    });

    // User checks in on 2026-10-03
    const updated = await StreakService.calculateStreak(user.id, '2026-10-03');
    // Streak: 2 + 1 (for 10-03) = 3; 10-02 kept streak alive without incrementing
    expect(updated?.currentStreak).toBe(3);
    expect(updated?.lastLogDate).toBe('2026-10-03');
  });

  it('consumes a weekly freeze to preserve streak across a single missed day', async () => {
    const user = await User.create({
      name: 'Streak Tester',
      email: 'streak5@test.org',
      passwordHash: 'hash',
      role: Role.Staff,
      currentStreak: 3,
      longestStreak: 3,
      lastLogDate: '2026-10-05' // Monday
    });

    // User misses Tuesday 2026-10-06 and logs on Wednesday 2026-10-07
    const updated = await StreakService.calculateStreak(user.id, '2026-10-07');
    expect(updated?.currentStreak).toBe(4);
    expect(updated?.lastLogDate).toBe('2026-10-07');

    const freeze = await StreakFreeze.findOne({ userId: user.id, date: '2026-10-06' });
    expect(freeze).not.toBeNull();
  });

  it('breaks streak when multiple unexcused days exceed available weekly freezes', async () => {
    const user = await User.create({
      name: 'Streak Tester',
      email: 'streak6@test.org',
      passwordHash: 'hash',
      role: Role.Staff,
      currentStreak: 5,
      longestStreak: 5,
      lastLogDate: '2026-10-05' // Monday
    });

    // User misses 2026-10-06 and 2026-10-07 (2 days missed, only 1 freeze allowed)
    // User logs on Thursday 2026-10-08
    const updated = await StreakService.calculateStreak(user.id, '2026-10-08');
    // Streak broke, restarts at 1 on 10-08
    expect(updated?.currentStreak).toBe(1);
    expect(updated?.longestStreak).toBe(5); // longest remains 5
  });

  it('recalculates streak from reading logs after log rejection', async () => {
    const user = await User.create({
      name: 'Streak Tester',
      email: 'streak7@test.org',
      passwordHash: 'hash',
      role: Role.Staff,
      currentStreak: 10,
      longestStreak: 10
    });

    const book = await Book.create({
      title: 'Test Book',
      author: 'Author',
      totalPages: 300,
      language: 'mr'
    });

    // Create 3 valid logs
    await ReadingLog.create([
      { userId: user.id, date: '2026-10-01', bookId: book.id, startPage: 0, currentPage: 10, pagesRead: 10 },
      { userId: user.id, date: '2026-10-02', bookId: book.id, startPage: 10, currentPage: 20, pagesRead: 10 },
      { userId: user.id, date: '2026-10-03', bookId: book.id, startPage: 20, currentPage: 30, pagesRead: 10, proof: { adminDecision: 'rejected' } } // rejected!
    ]);

    const updated = await StreakService.recalculateFromLogs(user.id);
    expect(updated?.currentStreak).toBe(2);
    expect(updated?.lastLogDate).toBe('2026-10-02');
  });

  it('returns real-time display streak of currentStreak if last log is today or yesterday', async () => {
    const today = getTodayDateString();
    const user = await User.create({
      name: 'Display Streak Tester',
      email: 'display@test.org',
      passwordHash: 'hash',
      role: Role.Staff,
      currentStreak: 4,
      longestStreak: 4,
      lastLogDate: today
    });

    const display = await StreakService.getDisplayStreak(user.id);
    expect(display).toBe(4);
  });
});
