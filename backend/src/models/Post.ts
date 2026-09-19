import mongoose, { Schema, Document } from 'mongoose';
import { BilingualText, PostType, NoticePriority } from '@shared/types';

export interface IPost extends Document {
  type: PostType;
  title: BilingualText;
  body: BilingualText;
  images: string[];
  priority?: NoticePriority;
  pinned: boolean;
  expiresAt?: Date;
  publishedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema({
  type: { type: String, enum: Object.values(PostType), required: true },
  title: {
    en: { type: String, required: true },
    mr: { type: String, required: true }
  },
  body: {
    en: { type: String, required: true },
    mr: { type: String, required: true }
  },
  images: [{ type: String }],
  priority: { type: String, enum: Object.values(NoticePriority) },
  pinned: { type: Boolean, default: false },
  expiresAt: { type: Date },
  publishedAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledAt: { type: Date }
}, { timestamps: true });

PostSchema.index({ type: 1 });
PostSchema.index({ publishedAt: -1 });
PostSchema.index({ pinned: 1 });
PostSchema.index({ expiresAt: 1 });

export const Post = mongoose.model<IPost>('Post', PostSchema);
