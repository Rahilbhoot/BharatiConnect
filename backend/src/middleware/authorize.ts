import { Request, Response, NextFunction } from 'express';
import { Role } from '@shared/types';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';

export const authorize = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Not authorized'));
    }
    
    next();
  };
};
