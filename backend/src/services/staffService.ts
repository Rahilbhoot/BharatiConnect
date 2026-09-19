import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { User, IUser } from '../models/User';
import { env } from '../config/env';
import { Role } from '@shared/types';
import { NotFoundError, ValidationError, ConflictError } from '../utils/AppError';
import { AuditLog } from '../models/AuditLog';

export class StaffService {
  static async createStaff(data: any, adminId: string) {
    if (data.email) {
      const existing = await User.findOne({ email: data.email });
      if (existing) throw new ConflictError('Email already in use');
    }
    if (data.phone) {
      const existing = await User.findOne({ phone: data.phone });
      if (existing) throw new ConflictError('Phone already in use');
    }

    const user = await User.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      departmentId: data.departmentId,
      language: data.language,
      role: Role.Staff,
      active: false,
      passwordHash: 'pending', 
    });

    user.inviteToken = jwt.sign({ id: user.id }, env.INVITE_SECRET, { expiresIn: '24h' });
    user.inviteExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await AuditLog.create({
      actorId: adminId,
      action: 'CREATE_STAFF',
      targetType: 'User',
      targetId: user.id,
      after: { email: user.email, name: user.name }
    });

    return { 
      user, 
      inviteLink: `${env.FRONTEND_URL}/invite?token=${user.inviteToken}`
    };
  }

  static async sendInvite(userId: string, adminId: string) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const inviteToken = jwt.sign({ id: user.id }, env.INVITE_SECRET, { expiresIn: '24h' });
    user.inviteToken = inviteToken;
    user.inviteExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await AuditLog.create({
      actorId: adminId,
      action: 'RESEND_INVITE',
      targetType: 'User',
      targetId: user.id
    });

    return { inviteLink: `${env.FRONTEND_URL}/invite?token=${user.inviteToken}` };
  }

  static async listStaff(filters: any) {
    const query: any = { role: Role.Staff };
    if (filters.departmentId) query.departmentId = filters.departmentId;
    if (filters.active !== undefined) query.active = filters.active;
    if (filters.search) {
      query.name = { $regex: filters.search, $options: 'i' };
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;

    const users = await User.find(query)
      .populate('departmentId', 'name')
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-passwordHash -twoFactorSecret -pushTokens');
      
    const total = await User.countDocuments(query);

    return { users, total, page, limit };
  }

  static async getStaffDetail(userId: string) {
    const user = await User.findById(userId)
      .populate('departmentId', 'name')
      .select('-passwordHash -twoFactorSecret');
    if (!user) throw new NotFoundError('User not found');

    return user;
  }

  static async updateStaff(userId: string, updates: any, adminId: string) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const before = { name: user.name, email: user.email, phone: user.phone, departmentId: user.departmentId };

    if (updates.email && updates.email !== user.email) {
      const existing = await User.findOne({ email: updates.email });
      if (existing) throw new ConflictError('Email already in use');
    }
    
    Object.assign(user, updates);
    await user.save();

    await AuditLog.create({
      actorId: adminId,
      action: 'UPDATE_STAFF',
      targetType: 'User',
      targetId: user.id,
      before,
      after: { name: user.name, email: user.email, phone: user.phone, departmentId: user.departmentId }
    });

    return user;
  }

  static async deactivateStaff(userId: string, adminId: string) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    user.active = false;
    await user.save();

    await AuditLog.create({
      actorId: adminId,
      action: 'DEACTIVATE_STAFF',
      targetType: 'User',
      targetId: user.id
    });

    return user;
  }

  static async reactivateStaff(userId: string, adminId: string) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    user.active = true;
    await user.save();

    await AuditLog.create({
      actorId: adminId,
      action: 'REACTIVATE_STAFF',
      targetType: 'User',
      targetId: user.id
    });

    return user;
  }
}
