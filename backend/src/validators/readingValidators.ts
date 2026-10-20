import { z } from 'zod';

export const checkInSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  currentPage: z.string().regex(/^\d+$/).transform(Number).optional(),
  endPage: z.string().regex(/^\d+$/).transform(Number).optional(),
  startPage: z.string().regex(/^\d+$/).transform(Number).optional(),
  note: z.string().max(280, 'Note cannot exceed 280 characters').optional()
}).refine(data => data.currentPage !== undefined || data.endPage !== undefined, {
  message: 'currentPage is required'
});

export const takeawaySchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  text: z.string().min(1, 'Takeaway text is required').max(280, 'Takeaway cannot exceed 280 characters')
});

export const manualBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  totalPages: z.number().int().positive('Total pages must be a positive integer'),
  language: z.string().default('mr'),
  genre: z.string().optional(),
  coverUrl: z.string().url().optional()
});

export const shelfActionSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  status: z.enum(['want_to_read', 'reading', 'finished']).default('want_to_read')
});

export const updateShelfStatusSchema = z.object({
  status: z.enum(['want_to_read', 'reading', 'finished'])
});

export const rateBookSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().max(280).optional()
});
