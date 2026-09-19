import mongoose, { Schema, Document } from 'mongoose';
import { NotificationType } from '@shared/types';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  payload?: any;
  readAt?: Date;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: Object.values(NotificationType), required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  payload: { type: Schema.Types.Mixed },
  readAt: { type: Date },
  createdAt: { type: Date, default: Date.now, expires: 90 * 24 * 60 * 60 } // TTL index 90 days
});

NotificationSchema.index({ userId: 1, readAt: 1 });
NotificationSchema.index({ createdAt: 1 }); // Required for TTL index even if implicitly created by expires option

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
