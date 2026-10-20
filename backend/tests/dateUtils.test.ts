import { describe, it, expect } from 'vitest';
import {
  getTodayDateString,
  yesterdayIST,
  getISOWeekString,
  differenceInDaysIST,
  daysBetween,
  dateRange,
  getNextDateString,
  getPreviousDateString,
  isBeforeHourIST,
  getHourIST
} from '../src/utils/dateUtils';

describe('dateUtils', () => {
  it('formats today and yesterday as YYYY-MM-DD in IST', () => {
    const today = getTodayDateString();
    const yesterday = yesterdayIST();

    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(yesterday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(differenceInDaysIST(today, yesterday)).toBe(1);
  });

  it('calculates days between dates correctly', () => {
    expect(daysBetween('2026-10-19', '2026-10-18')).toBe(1);
    expect(daysBetween('2026-10-19', '2026-10-19')).toBe(0);
    expect(daysBetween('2026-10-15', '2026-10-19')).toBe(-4);
  });

  it('generates next and previous date strings', () => {
    expect(getNextDateString('2026-10-19')).toBe('2026-10-20');
    expect(getPreviousDateString('2026-10-19')).toBe('2026-10-18');
  });

  it('generates date range inclusive', () => {
    const range = dateRange('2026-10-15', '2026-10-18');
    expect(range).toEqual([
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18'
    ]);
  });

  it('computes ISO week string (Monday to Sunday)', () => {
    // 2026-10-19 is a Monday
    const week = getISOWeekString('2026-10-19');
    expect(week).toMatch(/^2026-W\d{2}$/);
  });

  it('checks if a time is before given hour in IST', () => {
    // 03:00 UTC = 08:30 IST -> before 9 AM IST
    const morningDate = new Date('2026-10-19T03:00:00Z');
    expect(isBeforeHourIST(morningDate, 9)).toBe(true);

    // 04:00 UTC = 09:30 IST -> NOT before 9 AM IST
    const lateMorningDate = new Date('2026-10-19T04:00:00Z');
    expect(isBeforeHourIST(lateMorningDate, 9)).toBe(false);
  });
});
