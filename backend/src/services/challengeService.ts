import mongoose from 'mongoose';
import { Challenge, IChallenge } from '../models/Challenge';
import { ChallengeEntry, IChallengeEntry } from '../models/ChallengeEntry';
import { AuditLog } from '../models/AuditLog';
import { PointsService } from './pointsService';
import { ChallengeType } from '@shared/types';
import { NotFoundError, ValidationError, ConflictError } from '../utils/AppError';

export class ChallengeService {
  /**
   * PRD Game-05: Create a challenge (Admin/Owner only)
   */
  static async createChallenge(data: any, adminId: string): Promise<IChallenge> {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (end < start) {
      throw new ValidationError('End date cannot be earlier than start date');
    }
    if (!data.target || data.target <= 0) {
      throw new ValidationError('Target must be greater than 0');
    }
    if (!data.rewardPoints || data.rewardPoints <= 0) {
      throw new ValidationError('Reward points must be greater than 0');
    }

    const challenge = await Challenge.create({
      title: data.title,
      description: data.description,
      startDate: start,
      endDate: end,
      type: data.type,
      target: data.target,
      rewardPoints: data.rewardPoints,
      active: data.active !== undefined ? data.active : true,
      createdBy: new mongoose.Types.ObjectId(adminId)
    });

    await AuditLog.create({
      actorId: adminId,
      action: 'CREATE_CHALLENGE',
      targetType: 'Challenge',
      targetId: challenge._id,
      after: challenge.toObject()
    });

    return challenge;
  }

  /**
   * List currently active challenges
   */
  static async listActiveChallenges() {
    const now = new Date();
    return await Challenge.find({
      active: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).sort({ endDate: 1 });
  }

  /**
   * Staff joins an active challenge
   */
  static async joinChallenge(
    challengeId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId
  ): Promise<IChallengeEntry> {
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) throw new NotFoundError('Challenge not found');
    if (!challenge.active) throw new ValidationError('Challenge is not active');

    const existing = await ChallengeEntry.findOne({ challengeId, userId });
    if (existing) {
      throw new ConflictError('You have already joined this challenge');
    }

    return await ChallengeEntry.create({
      challengeId,
      userId,
      progress: 0
    });
  }

  /**
   * Update challenge progress for a user after a reading event
   */
  static async updateProgress(
    userId: string | mongoose.Types.ObjectId,
    pagesRead: number
  ) {
    const now = new Date();
    // Find active challenges that have not ended
    const activeChallenges = await Challenge.find({
      active: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    if (activeChallenges.length === 0) return;

    for (const challenge of activeChallenges) {
      const entry = await ChallengeEntry.findOne({
        challengeId: challenge._id,
        userId,
        completedAt: { $exists: false }
      });

      if (!entry) continue; // User has not joined or already completed

      if (challenge.type === ChallengeType.IndividualPages) {
        entry.progress += pagesRead;
      } else if (challenge.type === ChallengeType.IndividualDays) {
        entry.progress += 1;
      } else if (challenge.type === ChallengeType.CollectiveDays) {
        entry.progress += 1;
      }

      if (entry.progress >= challenge.target) {
        entry.completedAt = new Date();
        await PointsService.awardPoints(
          userId,
          challenge.rewardPoints,
          'challenge_completed',
          String(challenge._id),
          'Challenge'
        );
      }

      await entry.save();
    }
  }

  /**
   * Check challenge completion and award points
   */
  static async checkCompletion(
    challengeId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId
  ) {
    const [challenge, entry] = await Promise.all([
      Challenge.findById(challengeId),
      ChallengeEntry.findOne({ challengeId, userId })
    ]);

    if (!challenge || !entry) return null;

    if (!entry.completedAt && entry.progress >= challenge.target) {
      entry.completedAt = new Date();
      await entry.save();

      await PointsService.awardPoints(
        userId,
        challenge.rewardPoints,
        'challenge_completed',
        String(challenge._id),
        'Challenge'
      );
    }

    return entry;
  }

  /**
   * Get challenge detail with participant count and user progress
   */
  static async getChallengeDetail(
    challengeId: string | mongoose.Types.ObjectId,
    userId?: string | mongoose.Types.ObjectId
  ) {
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) throw new NotFoundError('Challenge not found');

    const participantCount = await ChallengeEntry.countDocuments({ challengeId: challenge._id });

    let userEntry: any = null;
    if (userId) {
      userEntry = await ChallengeEntry.findOne({ challengeId: challenge._id, userId });
    }

    return {
      challenge,
      participantCount,
      userEntry: userEntry
        ? {
            joined: true,
            progress: userEntry.progress,
            completed: !!userEntry.completedAt,
            completedAt: userEntry.completedAt
          }
        : {
            joined: false,
            progress: 0,
            completed: false
          }
    };
  }
}
