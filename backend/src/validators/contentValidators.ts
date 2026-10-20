import { z } from 'zod';
import { NoticePriority, VideoCategory, Language, SuggestionStatus } from '@shared/types';

export const createNoticeSchema = z.object({
  title: z.object({
    en: z.string().optional(),
    mr: z.string().optional()
  }).refine(data => !!data.en || !!data.mr, {
    message: 'Notice title must have at least English or Marathi text'
  }),
  body: z.object({
    en: z.string().optional(),
    mr: z.string().optional()
  }).refine(data => !!data.en || !!data.mr, {
    message: 'Notice body must have at least English or Marathi text'
  }),
  priority: z.enum([NoticePriority.Normal, NoticePriority.Urgent]).default(NoticePriority.Normal),
  pinned: z.boolean().default(false),
  expiresAt: z.string().datetime().optional()
});

export const updateNoticeSchema = z.object({
  title: z.object({
    en: z.string().optional(),
    mr: z.string().optional()
  }).optional(),
  body: z.object({
    en: z.string().optional(),
    mr: z.string().optional()
  }).optional(),
  priority: z.enum([NoticePriority.Normal, NoticePriority.Urgent]).optional(),
  pinned: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional()
});

export const createPostSchema = z.object({
  title: z.object({
    en: z.string().optional(),
    mr: z.string().optional()
  }).optional(),
  body: z.object({
    en: z.string().optional(),
    mr: z.string().optional()
  }).optional(),
  images: z.array(z.string()).max(5, 'Maximum 5 images allowed').optional()
});

export const addVideoSchema = z.object({
  youtubeLink: z.string().min(1, 'YouTube URL is required'),
  category: z.nativeEnum(VideoCategory),
  language: z.nativeEnum(Language),
  description: z.object({
    en: z.string().optional(),
    mr: z.string().optional()
  }).refine(data => !!data.en || !!data.mr, {
    message: 'Description must be provided in English or Marathi'
  })
});

export const bookSuggestionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  reason: z.string().max(500).optional(),
  language: z.nativeEnum(Language).default(Language.Marathi)
});

export const reviewSuggestionSchema = z.object({
  status: z.enum([SuggestionStatus.Approved, SuggestionStatus.Rejected]),
  createAsStaffPick: z.boolean().default(false)
});
