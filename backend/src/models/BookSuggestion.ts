import mongoose, { Schema, Document } from 'mongoose';
import { SuggestionStatus, Language } from '@shared/types';

export interface IBookSuggestion extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  author: string;
  reason?: string;
  language: Language;
  status: SuggestionStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BookSuggestionSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  reason: { type: String },
  language: { type: String, enum: Object.values(Language), required: true },
  status: { type: String, enum: Object.values(SuggestionStatus), default: SuggestionStatus.Pending },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date }
}, { timestamps: true });

BookSuggestionSchema.index({ status: 1 });
BookSuggestionSchema.index({ userId: 1 });

export const BookSuggestion = mongoose.model<IBookSuggestion>('BookSuggestion', BookSuggestionSchema);
