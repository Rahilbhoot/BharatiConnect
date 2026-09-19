import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Role } from '@shared/types';
import bcrypt from 'bcryptjs';
import { ConflictError, NotFoundError } from '../utils/AppError';

export class OwnerController {
  static async createAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body;
      const existing = await User.findOne({ email });
      if (existing) throw new ConflictError('Email already in use');

      const passwordHash = await bcrypt.hash(password, 12);
      const admin = await User.create({
        name,
        email,
        passwordHash,
        role: Role.Admin,
        active: true
      });
      res.status(201).json({ id: admin.id, name: admin.name, email: admin.email });
    } catch (err) { next(err); }
  }

  static async removeAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const admin = await User.findById(req.params.id);
      if (!admin || admin.role !== Role.Admin) throw new NotFoundError('Admin not found');

      admin.role = Role.Staff;
      await admin.save();
      res.json({ success: true });
    } catch (err) { next(err); }
  }
}
