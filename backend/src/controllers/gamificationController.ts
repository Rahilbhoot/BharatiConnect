import { Request, Response, NextFunction } from 'express';
import { GamificationService } from '../services/gamificationService';

export class GamificationController {
  static async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { departmentId } = req.query;
      const result = await GamificationService.getLeaderboard(departmentId as string);
      res.json(result);
    } catch (err) { next(err); }
  }

  static async getActiveChallenges(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await GamificationService.listActiveChallenges();
      res.json(result);
    } catch (err) { next(err); }
  }
}
