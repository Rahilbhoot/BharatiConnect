import { Role } from '@shared/types';
import { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        email?: string;
        phone?: string;
      };
    }
  }
}
