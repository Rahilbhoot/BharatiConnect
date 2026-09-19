import mongoose, { Schema, Document } from 'mongoose';

export interface IPointsLedger extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  reason: string; // e.g. 'reading_day', 'streak_7'
  referenceId?: mongoose.Types.ObjectId; // polymorphic
  referenceType?: string; // e.g. 'ReadingLog', 'Challenge'
  createdAt: Date;
}

const PointsLedgerSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  referenceId: { type: Schema.Types.ObjectId },
  referenceType: { type: String },
  createdAt: { type: Date, default: Date.now }
});

PointsLedgerSchema.index({ userId: 1 });
PointsLedgerSchema.index({ createdAt: 1 });

export const PointsLedger = mongoose.model<IPointsLedger>('PointsLedger', PointsLedgerSchema);
