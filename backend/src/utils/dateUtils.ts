import { format, toZonedTime } from 'date-fns-tz';
import {
  differenceInDays,
  parseISO,
  startOfDay,
  subDays,
  addDays,
  getISOWeek,
  getISOWeekYear
} from 'date-fns';

export const TIMEZONE = 'Asia/Kolkata';

export function getTodayDateString(): string {
  const zonedDate = toZonedTime(new Date(), TIMEZONE);
  return format(zonedDate, 'yyyy-MM-dd', { timeZone: TIMEZONE });
}

export function getDateString(date: Date): string {
  const zonedDate = toZonedTime(date, TIMEZONE);
  return format(zonedDate, 'yyyy-MM-dd', { timeZone: TIMEZONE });
}

export function yesterdayIST(): string {
  const zonedDate = toZonedTime(new Date(), TIMEZONE);
  const yest = subDays(zonedDate, 1);
  return format(yest, 'yyyy-MM-dd', { timeZone: TIMEZONE });
}

export function getPreviousDateString(dateStr: string): string {
  const d = parseISO(dateStr);
  const prev = subDays(d, 1);
  return format(prev, 'yyyy-MM-dd');
}

export function getNextDateString(dateStr: string): string {
  const d = parseISO(dateStr);
  const next = addDays(d, 1);
  return format(next, 'yyyy-MM-dd');
}

export function differenceInDaysIST(date1Str: string, date2Str: string): number {
  const d1 = startOfDay(parseISO(date1Str));
  const d2 = startOfDay(parseISO(date2Str));
  return differenceInDays(d1, d2);
}

export function daysBetween(date1Str: string, date2Str: string): number {
  return differenceInDaysIST(date1Str, date2Str);
}

export function getISOWeekString(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : toZonedTime(date, TIMEZONE);
  const weekNum = getISOWeek(d);
  const year = getISOWeekYear(d);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

export function dateRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  let curr = parseISO(startStr);
  const end = parseISO(endStr);
  while (curr <= end) {
    dates.push(format(curr, 'yyyy-MM-dd'));
    curr = addDays(curr, 1);
  }
  return dates;
}

export function isBeforeHourIST(date: Date, hour: number): boolean {
  const zoned = toZonedTime(date, TIMEZONE);
  return zoned.getHours() < hour;
}

export function getHourIST(date: Date): number {
  const zoned = toZonedTime(date, TIMEZONE);
  return zoned.getHours();
}
