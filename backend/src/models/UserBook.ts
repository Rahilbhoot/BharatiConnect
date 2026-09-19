import mongoose, { Schema, Document } from 'mongoose';
import { BookStatus } from '@shared/types';

export interface IUserBook extends Document {
  userId: mongoose.Types.ObjectId;
  bookId: mongoose.Types.ObjectId;
  status: BookStatus;
  currentPage: number;
  startedAt?: Date;
  finishedAt?: Date;
  rating?: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserBookSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  status: { type: String, enum: Object.values(BookStatus), required: true },
  currentPage: { type: Number, default: 0 },
  startedAt: { type: Date },
  finishedAt: { type: Date },
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String }
}, { timestamps: true });

UserBookSchema.index({ userId: 1, bookId: 1 }, { unique: true });
UserBookSchema.index({ userId: 1, status: 1 });

export const UserBook = mongoose.model<IUserBook>('UserBook', UserBookSchema);
