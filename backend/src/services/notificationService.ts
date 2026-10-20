import mongoose from 'mongoose';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { User } from '../models/User';
import { Notification, INotification } from '../models/Notification';
import { NotificationType } from '@shared/types';
import { NotFoundError, ValidationError } from '../utils/AppError';

import { expo } from '../config/firebase';

export class NotificationService {
  /**
   * PRD Notify-01: Register Expo push token for user
   */
  static async registerPushToken(
    userId: string | mongoose.Types.ObjectId,
    token: string
  ) {
    if (!token || !Expo.isExpoPushToken(token)) {
      throw new ValidationError('Invalid Expo push token');
    }

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    if (!user.pushTokens.includes(token)) {
      user.pushTokens.push(token);
      await user.save();
    }

    return { message: 'Push token registered successfully' };
  }

  /**
   * PRD Notify-01: Send push notification to user
   */
  static async sendPush(
    userId: string | mongoose.Types.ObjectId,
    title: string,
    body: string,
    data?: any
  ) {
    const user = await User.findById(userId);
    if (!user || user.pushTokens.length === 0) return;

    const messages: ExpoPushMessage[] = [];
    for (const pushToken of user.pushTokens) {
      if (!Expo.isExpoPushToken(pushToken)) continue;
      messages.push({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data
      });
    }

    if (messages.length > 0) {
      try {
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
          await expo.sendPushNotificationsAsync(chunk);
        }
      } catch (err: any) {
        console.warn('Failed to send push notification via Expo:', err.message);
      }
    }
  }

  /**
   * PRD Notify-01: Send bulk push notifications to multiple users
   */
  static async sendBulkPush(
    userIds: (string | mongoose.Types.ObjectId)[],
    title: string,
    body: string,
    data?: any
  ) {
    const users = await User.find({ _id: { $in: userIds } });
    const messages: ExpoPushMessage[] = [];

    for (const user of users) {
      for (const token of user.pushTokens) {
        if (!Expo.isExpoPushToken(token)) continue;
        messages.push({
          to: token,
          sound: 'default',
          title,
          body,
          data
        });
      }
    }

    if (messages.length > 0) {
      try {
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
          await expo.sendPushNotificationsAsync(chunk);
        }
      } catch (err: any) {
        console.warn('Failed to send bulk push notifications via Expo:', err.message);
      }
    }
  }

  /**
   * PRD Notify-03: Create an in-app notification document
   */
  static async createInAppNotification(
    userId: string | mongoose.Types.ObjectId,
    type: NotificationType,
    title: string,
    body: string,
    payload?: any
  ): Promise<INotification> {
    return await Notification.create({
      userId,
      type,
      title,
      body,
      payload
    });
  }

  /**
   * PRD Notify-03: Get notifications for user, unread first
   */
  static async getNotifications(
    userId: string | mongoose.Types.ObjectId,
    page = 1,
    limit = 20
  ) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ readAt: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, readAt: { $exists: false } })
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Mark a single notification as read
   */
  static async markRead(
    notificationId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId
  ) {
    const notif = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { readAt: new Date() },
      { new: true }
    );
    if (!notif) throw new NotFoundError('Notification not found');
    return notif;
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllRead(userId: string | mongoose.Types.ObjectId) {
    await Notification.updateMany(
      { userId, readAt: { $exists: false } },
      { readAt: new Date() }
    );
    return { message: 'All notifications marked as read' };
  }
}
