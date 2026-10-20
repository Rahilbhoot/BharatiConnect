import { z } from 'zod';
import { HolidayType } from '@shared/types';

export const addHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  name: z.object({
    en: z.string().optional(),
    mr: z.string().optional()
  }).refine(data => !!data.en || !!data.mr, {
    message: 'Name must be provided in English or Marathi'
  }),
  type: z.nativeEnum(HolidayType),
  userId: z.string().nullable().optional()
});

export const addMissedDaySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  bookId: z.string().min(1, 'Book ID is required'),
  pagesRead: z.number().int().positive('Pages read must be positive'),
  reason: z.string().min(1, 'Reason is required for manual day backfill')
});
