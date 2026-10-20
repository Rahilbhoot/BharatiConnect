import { z } from 'zod';
import { ChallengeType } from '@shared/types';

export const createChallengeSchema = z.object({
  title: z.object({
    en: z.string().optional(),
    mr: z.string().optional()
  }).refine(data => !!data.en || !!data.mr, {
    message: 'Challenge title must be provided in English or Marathi'
  }),
  description: z.object({
    en: z.string().optional(),
    mr: z.string().optional()
  }).refine(data => !!data.en || !!data.mr, {
    message: 'Challenge description must be provided in English or Marathi'
  }),
  startDate: z.string(),
  endDate: z.string(),
  type: z.nativeEnum(ChallengeType),
  target: z.number().int().positive('Target must be a positive integer'),
  rewardPoints: z.number().int().positive('Reward points must be a positive integer'),
  active: z.boolean().default(true)
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
  message: 'End date must be greater than or equal to start date'
});

export const updateChallengeSchema = z.object({
  title: z.object({
    en: z.string().optional(),
    mr: z.string().optional()
  }).optional(),
  description: z.object({
    en: z.string().optional(),
    mr: z.string().optional()
  }).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  target: z.number().int().positive().optional(),
  rewardPoints: z.number().int().positive().optional(),
  active: z.boolean().optional()
});
