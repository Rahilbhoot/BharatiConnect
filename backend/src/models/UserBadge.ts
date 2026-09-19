import mongoose, { Schema, Document } from 'mongoose';

export interface IUserBadge extends Document {
  userId: mongoose.Types.ObjectId;
  badgeKey: string;
  earnedAt: Date;
}

const UserBadgeSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  badgeKey: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now }
});

UserBadgeSchema.index({ userId: 1, badgeKey: 1 }, { unique: true });

export const UserBadge = mongoose.model<IUserBadge>('UserBadge', UserBadgeSchema);
