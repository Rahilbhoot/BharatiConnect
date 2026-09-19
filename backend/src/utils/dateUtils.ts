import { format, toZonedTime } from 'date-fns-tz';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';

const TIMEZONE = 'Asia/Kolkata';

export function getTodayDateString(): string {
  const zonedDate = toZonedTime(new Date(), TIMEZONE);
  return format(zonedDate, 'yyyy-MM-dd', { timeZone: TIMEZONE });
}

export function getDateString(date: Date): string {
  const zonedDate = toZonedTime(date, TIMEZONE);
  return format(zonedDate, 'yyyy-MM-dd', { timeZone: TIMEZONE });
}

export function differenceInDaysIST(date1Str: string, date2Str: string): number {
  const d1 = startOfDay(parseISO(date1Str));
  const d2 = startOfDay(parseISO(date2Str));
  return differenceInDays(d1, d2);
}
