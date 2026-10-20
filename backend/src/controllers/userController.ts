import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { NotificationService } from '../services/notificationService';
import { PointsService } from '../services/pointsService';
import { StreakService } from '../services/streakService';
import { NotFoundError } from '../utils/AppError';

export class UserController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.user!.id)
        .populate('departmentId', 'name code')
        .select('-passwordHash -twoFactorSecret -inviteToken');

      if (!user) throw new NotFoundError('User not found');

      const displayStreak = await StreakService.getDisplayStreak(user._id);

      res.json({
        user,
        displayStreak
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.user!.id);
      if (!user) throw new NotFoundError('User not found');

      const { language, reminderTime, name } = req.body;
      if (language) user.language = language;
      if (reminderTime) user.reminderTime = reminderTime;
      if (name) user.name = name.trim();

      await user.save();
      res.json({ message: 'Profile updated successfully', user });
    } catch (err) {
      next(err);
    }
  }

  static async registerPushToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      const result = await NotificationService.registerPushToken(req.user!.id, token);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const result = await NotificationService.getNotifications(req.user!.id, page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async markNotificationRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.markRead(req.params.id, req.user!.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async markAllNotificationsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.markAllRead(req.user!.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async recordPhotoConsent(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.user!.id);
      if (!user) throw new NotFoundError('User not found');

      user.photoConsentGiven = true;
      await user.save();

      res.json({ message: 'Photo consent recorded successfully', photoConsentGiven: true });
    } catch (err) {
      next(err);
    }
  }

  static async getPointsHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const result = await PointsService.getPointsHistory(req.user!.id, page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getStaffDirectory(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await User.find({ active: true })
        .populate('departmentId', 'name')
        .select('name email phone role departmentId currentStreak points level language avatarColor createdAt')
        .sort({ name: 1 });
      res.json(users);
    } catch (err) {
      next(err);
    }
  }
}
