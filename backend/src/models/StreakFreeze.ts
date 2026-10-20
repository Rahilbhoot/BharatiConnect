import mongoose, { Schema, Document } from 'mongoose';

export interface IStreakFreeze extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  week: string; // e.g. "2026-W38"
  createdAt: Date;
}

const StreakFreezeSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  week: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

StreakFreezeSchema.index({ userId: 1, date: 1 }, { unique: true });
StreakFreezeSchema.index({ userId: 1, week: 1 });

export const StreakFreeze = mongoose.model<IStreakFreeze>('StreakFreeze', StreakFreezeSchema);
