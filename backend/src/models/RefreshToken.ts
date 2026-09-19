import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string; // hashed
  family: string; // UUID to group token rotations
  expiresAt: Date;
  revoked: boolean;
}

const RefreshTokenSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  family: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  revoked: { type: Boolean, default: false }
});

RefreshTokenSchema.index({ token: 1 });
RefreshTokenSchema.index({ userId: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
