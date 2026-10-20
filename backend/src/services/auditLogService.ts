import mongoose from 'mongoose';
import { AuditLog, IAuditLog } from '../models/AuditLog';

export class AuditLogService {
  /**
   * PRD Admin-09: Record an administrative action
   */
  static async log(
    actorId: string | mongoose.Types.ObjectId,
    action: string,
    targetType: string,
    targetId: string | mongoose.Types.ObjectId,
    before?: any,
    after?: any,
    reason?: string
  ): Promise<IAuditLog> {
    return await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(actorId),
      action,
      targetType,
      targetId: new mongoose.Types.ObjectId(targetId),
      before,
      after,
      reason
    });
  }

  /**
   * PRD Admin-09: Retrieve audit logs with filtering and pagination
   */
  static async getAuditLogs(
    page = 1,
    limit = 20,
    filters?: {
      actorId?: string;
      action?: string;
      targetType?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const query: any = {};

    if (filters?.actorId) query.actorId = new mongoose.Types.ObjectId(filters.actorId);
    if (filters?.action) query.action = filters.action;
    if (filters?.targetType) query.targetType = filters.targetType;

    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'name email role'),
      AuditLog.countDocuments(query)
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}
