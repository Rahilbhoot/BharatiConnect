import mongoose from 'mongoose';
import { User } from '../models/User';
import { PointsLedger } from '../models/PointsLedger';
import { GamificationService } from './gamificationService';
import { NotFoundError } from '../utils/AppError';

export class PointsService {
  /**
   * Award points to user and record in ledger
   */
  static async awardPoints(
    userId: string | mongoose.Types.ObjectId,
    amount: number,
    reason: string,
    referenceId?: string,
    referenceType?: string
  ) {
    if (amount <= 0) return;

    try {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        await PointsLedger.create(
          [{
            userId,
            amount,
            reason,
            referenceId,
            referenceType
          }],
          { session }
        );

        const user = await User.findById(userId).session(session);
        if (user) {
          user.points = (user.points || 0) + amount;
          user.level = GamificationService.calculateLevel(user.points);
          await user.save({ session });
        }

        await session.commitTransaction();
      } catch (txErr) {
        await session.abortTransaction();
        throw txErr;
      } finally {
        session.endSession();
      }
    } catch (err: any) {
      if (err?.message && (err.message.includes('replica set') || err.message.includes('Transaction numbers'))) {
        await PointsLedger.create([{
          userId,
          amount,
          reason,
          referenceId,
          referenceType
        }]);
        const user = await User.findById(userId);
        if (user) {
          user.points = (user.points || 0) + amount;
          user.level = GamificationService.calculateLevel(user.points);
          await user.save();
        }
      } else {
        throw err;
      }
    }

    // Check badge unlocks after point award
    await GamificationService.checkBadges(userId);
  }

  /**
   * Reverse points previously awarded for a reference (e.g. rejected reading log)
   */
  static async reversePoints(
    userId: string | mongoose.Types.ObjectId,
    referenceId: string,
    reason = 'admin_rejection'
  ) {
    const originalEntry = await PointsLedger.findOne({
      userId,
      referenceId,
      amount: { $gt: 0 }
    });

    if (!originalEntry) return null;

    const reverseAmount = -Math.abs(originalEntry.amount);

    try {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        await PointsLedger.create(
          [{
            userId,
            amount: reverseAmount,
            reason,
            referenceId,
            referenceType: originalEntry.referenceType
          }],
          { session }
        );

        const user = await User.findById(userId).session(session);
        if (user) {
          user.points = Math.max(0, (user.points || 0) + reverseAmount);
          user.level = GamificationService.calculateLevel(user.points);
          await user.save({ session });
        }

        await session.commitTransaction();
      } catch (txErr) {
        await session.abortTransaction();
        throw txErr;
      } finally {
        session.endSession();
      }
    } catch (err: any) {
      if (err?.message && (err.message.includes('replica set') || err.message.includes('Transaction numbers'))) {
        await PointsLedger.create([{
          userId,
          amount: reverseAmount,
          reason,
          referenceId,
          referenceType: originalEntry.referenceType
        }]);
        const user = await User.findById(userId);
        if (user) {
          user.points = Math.max(0, (user.points || 0) + reverseAmount);
          user.level = GamificationService.calculateLevel(user.points);
          await user.save();
        }
      } else {
        throw err;
      }
    }

    return reverseAmount;
  }

  /**
   * Get points history for user
   */
  static async getPointsHistory(
    userId: string | mongoose.Types.ObjectId,
    page = 1,
    limit = 30
  ) {
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      PointsLedger.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PointsLedger.countDocuments({ userId })
    ]);

    return {
      entries,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}
