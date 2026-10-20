import { Request, Response, NextFunction } from 'express';
import { ChallengeService } from '../services/challengeService';
import { Challenge } from '../models/Challenge';
import { AuditLog } from '../models/AuditLog';
import { NotFoundError } from '../utils/AppError';
import mongoose from 'mongoose';

export class ChallengeController {
  static async listActiveChallenges(req: Request, res: Response, next: NextFunction) {
    try {
      const challenges = await ChallengeService.listActiveChallenges();
      res.json(challenges);
    } catch (err) {
      next(err);
    }
  }

  static async getChallengeDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ChallengeService.getChallengeDetail(req.params.id, req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async joinChallenge(req: Request, res: Response, next: NextFunction) {
    try {
      const entry = await ChallengeService.joinChallenge(req.params.id, req.user!.id);
      res.status(201).json({ message: 'Successfully joined challenge', entry });
    } catch (err) {
      next(err);
    }
  }

  static async createChallenge(req: Request, res: Response, next: NextFunction) {
    try {
      const challenge = await ChallengeService.createChallenge(req.body, req.user!.id);
      res.status(201).json(challenge);
    } catch (err) {
      next(err);
    }
  }

  static async deactivateChallenge(req: Request, res: Response, next: NextFunction) {
    try {
      const challenge = await Challenge.findById(req.params.id);
      if (!challenge) throw new NotFoundError('Challenge not found');

      challenge.active = false;
      await challenge.save();

      await AuditLog.create({
        actorId: new mongoose.Types.ObjectId(req.user!.id),
        action: 'DEACTIVATE_CHALLENGE',
        targetType: 'Challenge',
        targetId: challenge._id
      });

      res.json({ message: 'Challenge deactivated successfully' });
    } catch (err) {
      next(err);
    }
  }
}
