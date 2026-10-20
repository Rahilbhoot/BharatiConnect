import mongoose from 'mongoose';
import { ReadingLog } from '../models/ReadingLog';
import { AuditLog } from '../models/AuditLog';
import { PointsService } from './pointsService';
import { StreakService } from './streakService';
import { ProofOutcome } from '@shared/types';
import { NotFoundError, ValidationError } from '../utils/AppError';
import { subDays } from 'date-fns';

export class ProofReviewService {
  /**
   * PRD 5.12, Proof-05: Get queue of proofs awaiting admin review
   */
  static async getReviewQueue(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const query = {
      $or: [
        { 'proof.status': ProofOutcome.NeedsReview },
        { 'proof.spotCheck': true }
      ],
      'proof.adminDecision': { $exists: false }
    };

    const [logs, total] = await Promise.all([
      ReadingLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email departmentId')
        .populate('bookId', 'title author totalPages coverUrl'),
      ReadingLog.countDocuments(query)
    ]);

    return {
      queue: logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * PRD Proof-04, 6.9: Admin submits review decision (accepted / rejected)
   */
  static async submitDecision(
    logId: string | mongoose.Types.ObjectId,
    decision: 'accepted' | 'rejected',
    adminId: string,
    reason?: string
  ) {
    if (decision !== 'accepted' && decision !== 'rejected') {
      throw new ValidationError('Decision must be either "accepted" or "rejected"');
    }

    const log = await ReadingLog.findById(logId);
    if (!log) throw new NotFoundError('Reading log not found');

    const beforeState = log.toObject();

    if (!log.proof) {
      log.proof = {
        status: ProofOutcome.NeedsReview,
        attempts: 1,
        spotCheck: false
      };
    }

    log.proof.adminDecision = decision;
    log.proof.reviewedBy = new mongoose.Types.ObjectId(adminId);
    log.proof.reviewedAt = new Date();

    if (decision === 'accepted') {
      log.provisional = false;
      log.proof.status = ProofOutcome.Accepted;
    } else {
      // Rejection: PRD 6.9 & 6.10
      // 1. Mark status as retake/rejected
      log.proof.status = ProofOutcome.Retake;

      // 2. Reverse points via PointsLedger
      await PointsService.reversePoints(log.userId, log.id, 'admin_rejection');

      // 3. Recalculate streak from scratch
      await StreakService.recalculateFromLogs(log.userId);
    }

    await log.save();

    // 4. Audit Log
    await AuditLog.create({
      actorId: adminId,
      action: 'REVIEW_PROOF',
      targetType: 'ReadingLog',
      targetId: log._id,
      before: beforeState,
      after: log.toObject(),
      reason
    });

    return log;
  }

  /**
   * PRD 7.6: Delete photos for needs_review items older than 7 days and auto-accept
   */
  static async cleanupExpiredPhotos() {
    const cutoff = subDays(new Date(), 7);

    const expiredLogs = await ReadingLog.find({
      'proof.status': ProofOutcome.NeedsReview,
      'proof.adminDecision': { $exists: false },
      createdAt: { $lte: cutoff }
    });

    for (const log of expiredLogs) {
      log.provisional = false;
      if (log.proof) {
        log.proof.status = ProofOutcome.Accepted;
        log.proof.adminDecision = 'accepted';
        log.proof.imageRef = undefined; // Discard photo
      }
      await log.save();
    }

    return expiredLogs.length;
  }
}
