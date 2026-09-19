import mongoose, { Schema, Document } from 'mongoose';

export interface IChallengeEntry extends Document {
  challengeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  progress: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeEntrySchema: Schema = new Schema({
  challengeId: { type: Schema.Types.ObjectId, ref: 'Challenge', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  progress: { type: Number, default: 0 },
  completedAt: { type: Date }
}, { timestamps: true });

ChallengeEntrySchema.index({ challengeId: 1, userId: 1 }, { unique: true });

export const ChallengeEntry = mongoose.model<IChallengeEntry>('ChallengeEntry', ChallengeEntrySchema);
