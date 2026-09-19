import mongoose, { Schema, Document } from 'mongoose';
import { BilingualText } from '@shared/types';

export interface IDepartment extends Document {
  name: BilingualText;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema: Schema = new Schema({
  name: {
    en: { type: String, required: true, unique: true },
    mr: { type: String, required: true, unique: true }
  },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export const Department = mongoose.model<IDepartment>('Department', DepartmentSchema);
