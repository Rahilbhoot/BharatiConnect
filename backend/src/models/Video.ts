import mongoose, { Schema, Document } from 'mongoose';
import { BilingualText, VideoCategory, Language } from '@shared/types';

export interface IVideo extends Document {
  youtubeId: string;
  title: string;
  thumbnail: string;
  category: VideoCategory;
  language: Language;
  description: BilingualText;
  pinnedWeek?: string; // ISO week string e.g., '2026-W38'
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema: Schema = new Schema({
  youtubeId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  thumbnail: { type: String, required: true },
  category: { type: String, enum: Object.values(VideoCategory), required: true },
  language: { type: String, enum: Object.values(Language), required: true },
  description: {
    en: { type: String, required: true },
    mr: { type: String, required: true }
  },
  pinnedWeek: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

VideoSchema.index({ category: 1 });
VideoSchema.index({ language: 1 });
VideoSchema.index({ pinnedWeek: 1 });

export const Video = mongoose.model<IVideo>('Video', VideoSchema);
