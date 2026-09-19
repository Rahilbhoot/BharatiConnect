import mongoose, { Schema, Document } from 'mongoose';

export interface IBook extends Document {
  title: string;
  author: string;
  totalPages: number;
  language: string;
  coverUrl?: string;
  googleBooksId?: string;
  staffPick: boolean;
  genre?: string;
  createdBy?: mongoose.Types.ObjectId; // if added manually
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema: Schema = new Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  totalPages: { type: Number, required: true },
  language: { type: String, required: true },
  coverUrl: { type: String },
  googleBooksId: { type: String, unique: true, sparse: true },
  staffPick: { type: Boolean, default: false },
  genre: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

BookSchema.index({ title: 'text', author: 'text' });
BookSchema.index({ staffPick: 1 });
BookSchema.index({ language: 1 });
BookSchema.index({ genre: 1 });

export const Book = mongoose.model<IBook>('Book', BookSchema);
