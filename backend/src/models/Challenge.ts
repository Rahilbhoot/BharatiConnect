import mongoose, { Schema, Document } from 'mongoose';
import { BilingualText, ChallengeType } from '@shared/types';

export interface IChallenge extends Document {
  title: BilingualText;
  description: BilingualText;
  startDate: Date;
  endDate: Date;
  type: ChallengeType;
  target: number;
  rewardPoints: number;
  active: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema: Schema = new Schema({
  title: {
    en: { type: String, required: true },
    mr: { type: String, required: true }
  },
  description: {
    en: { type: String, required: true },
    mr: { type: String, required: true }
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  type: { type: String, enum: Object.values(ChallengeType), required: true },
  target: { type: Number, required: true },
  rewardPoints: { type: Number, required: true },
  active: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

ChallengeSchema.index({ startDate: 1, endDate: 1 });
ChallengeSchema.index({ active: 1 });

export const Challenge = mongoose.model<IChallenge>('Challenge', ChallengeSchema);
