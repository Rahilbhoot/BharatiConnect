import mongoose, { Schema, Document } from 'mongoose';
import { ProofMode, Language } from '@shared/types';

export interface ISettings extends Document {
  minimumPages: number;
  proofMode: ProofMode;
  freezesPerWeek: number;
  defaultReminderTime: string;
  nudgeTime: string;
  spotCheckRate: number;
  defaultLanguage: Language;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema({
  minimumPages: { type: Number, default: 1 },
  proofMode: { type: String, enum: Object.values(ProofMode), default: ProofMode.Off },
  freezesPerWeek: { type: Number, default: 1 },
  defaultReminderTime: { type: String, default: '08:00' },
  nudgeTime: { type: String, default: '20:00' },
  spotCheckRate: { type: Number, default: 0.05 },
  defaultLanguage: { type: String, enum: Object.values(Language), default: Language.Marathi }
}, { timestamps: true });

export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
