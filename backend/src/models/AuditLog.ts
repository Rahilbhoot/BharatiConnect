import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: mongoose.Types.ObjectId;
  action: string;
  targetType: string;
  targetId: mongoose.Types.ObjectId;
  before?: any;
  after?: any;
  reason?: string;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema({
  actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  before: { type: Schema.Types.Mixed },
  after: { type: Schema.Types.Mixed },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now }
});

AuditLogSchema.index({ actorId: 1 });
AuditLogSchema.index({ targetType: 1, targetId: 1 });
AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
