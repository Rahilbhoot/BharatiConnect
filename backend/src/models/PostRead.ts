import mongoose, { Schema, Document } from 'mongoose';

export interface IPostRead extends Document {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  readAt: Date;
}

const PostReadSchema: Schema = new Schema({
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  readAt: { type: Date, default: Date.now }
});

PostReadSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const PostRead = mongoose.model<IPostRead>('PostRead', PostReadSchema);
