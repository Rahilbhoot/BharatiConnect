import { Request, Response, NextFunction } from 'express';
import { GamificationService } from '../services/gamificationService';

export class GamificationController {
  static async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { departmentId, period, scope } = req.query;
      const result = await GamificationService.getLeaderboard({
        departmentId: departmentId as string,
        period: (period as 'weekly' | 'monthly') || 'weekly',
        scope: (scope as 'department' | 'individual') || 'individual',
        requestingUserId: req.user?.id
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getActiveChallenges(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await GamificationService.listActiveChallenges();
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
