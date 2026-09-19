import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoView extends Document {
  videoId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  watchedAt: Date;
}

const VideoViewSchema: Schema = new Schema({
  videoId: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  watchedAt: { type: Date, default: Date.now }
});

VideoViewSchema.index({ videoId: 1, userId: 1 }, { unique: true });

export const VideoView = mongoose.model<IVideoView>('VideoView', VideoViewSchema);
