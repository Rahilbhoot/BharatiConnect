import mongoose, { Schema, Document } from 'mongoose';
import { ProofOutcome } from '@shared/types';

export interface IReadingLog extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  bookId: mongoose.Types.ObjectId;
  startPage: number;
  currentPage: number;
  pagesRead: number;
  note?: string;
  provisional: boolean;
  proof?: {
    status: ProofOutcome;
    verdict?: any; // mixed object from model
    imageHash?: string;
    attempts: number;
    imageRef?: string;
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    spotCheck: boolean;
    adminDecision?: 'accepted' | 'rejected';
  };
  createdBy?: mongoose.Types.ObjectId; // admin who manually added it
  createdAt: Date;
  updatedAt: Date;
}

const ReadingLogSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  startPage: { type: Number, required: true },
  currentPage: { type: Number, required: true },
  pagesRead: { type: Number, required: true },
  note: { type: String, maxlength: 280 },
  provisional: { type: Boolean, default: false },
  proof: {
    status: { type: String, enum: Object.values(ProofOutcome) },
    verdict: { type: Schema.Types.Mixed },
    imageHash: { type: String },
    attempts: { type: Number, default: 0 },
    imageRef: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    spotCheck: { type: Boolean, default: false },
    adminDecision: { type: String, enum: ['accepted', 'rejected'] }
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

ReadingLogSchema.index({ userId: 1, date: 1 }, { unique: true });
ReadingLogSchema.index({ 'proof.status': 1 });
ReadingLogSchema.index({ date: 1 });

export const ReadingLog = mongoose.model<IReadingLog>('ReadingLog', ReadingLogSchema);
