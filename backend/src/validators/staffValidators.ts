import { z } from 'zod';
import { Language } from '@shared/types';

export const createStaffSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Object ID'),
  language: z.nativeEnum(Language).default(Language.Marathi)
}).refine(data => data.email || data.phone, {
  message: 'Either email or phone must be provided',
  path: ['email']
});

export const updateStaffSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Object ID').optional(),
  language: z.nativeEnum(Language).optional()
});

export const departmentSchema = z.object({
  name: z.object({
    en: z.string().min(1),
    mr: z.string().min(1)
  })
});
