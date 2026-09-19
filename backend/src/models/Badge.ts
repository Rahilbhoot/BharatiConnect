import mongoose, { Schema, Document } from 'mongoose';
import { BilingualText } from '@shared/types';

export interface IBadge extends Document {
  key: string;
  name: BilingualText;
  description: BilingualText;
  rule: string;
  icon: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BadgeSchema: Schema = new Schema({
  key: { type: String, required: true, unique: true },
  name: {
    en: { type: String, required: true },
    mr: { type: String, required: true }
  },
  description: {
    en: { type: String, required: true },
    mr: { type: String, required: true }
  },
  rule: { type: String, required: true },
  icon: { type: String, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export const Badge = mongoose.model<IBadge>('Badge', BadgeSchema);
