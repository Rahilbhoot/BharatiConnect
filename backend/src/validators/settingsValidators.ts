import { z } from 'zod';
import { ProofMode, Language } from '@shared/types';

export const updateSettingsSchema = z.object({
  minimumPages: z.number().int().positive().optional(),
  proofMode: z.nativeEnum(ProofMode).optional(),
  freezesPerWeek: z.number().int().min(0).max(7).optional(),
  defaultReminderTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm format').optional(),
  nudgeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm format').optional(),
  spotCheckRate: z.number().min(0).max(1).optional(),
  defaultLanguage: z.nativeEnum(Language).optional()
});
