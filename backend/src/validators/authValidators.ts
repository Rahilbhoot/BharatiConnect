import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required')
});

export const acceptInviteSchema = z.object({
  inviteToken: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(1, 'Name is required')
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

export const twoFactorVerifySchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits')
});
