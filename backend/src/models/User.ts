import mongoose, { Schema, Document } from 'mongoose';
import { Role, Language } from '@shared/types';

export interface IUser extends Document {
  name: string;
  email?: string;
  phone?: string;
  passwordHash: string;
  role: Role;
  departmentId?: mongoose.Types.ObjectId;
  language: Language;
  reminderTime: string; // HH:mm
  active: boolean;
  currentStreak: number;
  longestStreak: number;
  lastLogDate?: string; // YYYY-MM-DD
  points: number;
  level: string;
  pushTokens: string[];
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  inviteToken?: string;
  inviteExpiresAt?: Date;
  failedLoginAttempts: number;
  lockoutUntil?: Date;
  photoConsentGiven: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: Object.values(Role), default: Role.Staff },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  language: { type: String, enum: Object.values(Language), default: Language.Marathi },
  reminderTime: { type: String, default: '08:00' },
  active: { type: Boolean, default: true },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastLogDate: { type: String },
  points: { type: Number, default: 0 },
  level: { type: String, default: 'beginner' },
  pushTokens: [{ type: String }],
  twoFactorSecret: { type: String },
  twoFactorEnabled: { type: Boolean, default: false },
  inviteToken: { type: String },
  inviteExpiresAt: { type: Date },
  failedLoginAttempts: { type: Number, default: 0 },
  lockoutUntil: { type: Date },
  photoConsentGiven: { type: Boolean, default: false },
}, { timestamps: true });

UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
UserSchema.index({ role: 1 });
UserSchema.index({ departmentId: 1 });
UserSchema.index({ active: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
