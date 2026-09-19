import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/AppError';
import speakeasy from 'speakeasy';
import { User } from '../models/User';

export const requireTwoFactor = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return next(new UnauthorizedError('Not authenticated'));
  
  const token = req.headers['x-2fa-token'] as string;
  if (!token) return next(new UnauthorizedError('2FA token required'));

  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.twoFactorSecret) return next(new UnauthorizedError('2FA not set up'));

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (!verified) return next(new UnauthorizedError('Invalid 2FA token'));
    next();
  } catch (err) {
    next(err);
  }
};
