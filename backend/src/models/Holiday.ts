import mongoose, { Schema, Document } from 'mongoose';
import { BilingualText, HolidayType } from '@shared/types';

export interface IHoliday extends Document {
  date: string; // YYYY-MM-DD
  name: BilingualText;
  type: HolidayType;
  userId?: mongoose.Types.ObjectId; // null for whole org
  createdAt: Date;
  updatedAt: Date;
}

const HolidaySchema: Schema = new Schema({
  date: { type: String, required: true },
  name: {
    en: { type: String, required: true },
    mr: { type: String, required: true }
  },
  type: { type: String, enum: Object.values(HolidayType), required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Sparse index allows null userId but unique constraint when userId is present
HolidaySchema.index({ date: 1, userId: 1 }, { unique: true });
HolidaySchema.index({ date: 1 });

export const Holiday = mongoose.model<IHoliday>('Holiday', HolidaySchema);
