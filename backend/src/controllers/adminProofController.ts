import { Request, Response, NextFunction } from 'express';
import { ProofReviewService } from '../services/proofReviewService';

export class AdminProofController {
  static async getReviewQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const result = await ProofReviewService.getReviewQueue(page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async submitDecision(req: Request, res: Response, next: NextFunction) {
    try {
      const { decision, reason } = req.body;
      const result = await ProofReviewService.submitDecision(
        req.params.id,
        decision,
        req.user!.id,
        reason
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
