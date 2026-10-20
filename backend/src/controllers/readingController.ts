import { Request, Response, NextFunction } from 'express';
import { ReadingService } from '../services/readingService';

export class ReadingController {
  static async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookId, currentPage, startPage, endPage, note } = req.body;
      const file = req.file;

      // Handle currentPage (new contract) or endPage (legacy fallback)
      const pageToUse = currentPage !== undefined ? Number(currentPage) : Number(endPage);

      const result = await ReadingService.checkIn(
        req.user!.id,
        bookId,
        pageToUse,
        note,
        file
      );

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async logReading(req: Request, res: Response, next: NextFunction) {
    return ReadingController.checkIn(req, res, next);
  }

  static async getStreak(req: Request, res: Response, next: NextFunction) {
    try {
      const streak = await ReadingService.getStreak(req.user!.id);
      res.status(200).json(streak);
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const history = await ReadingService.getHistory(req.user!.id, page, limit, month, year);
      res.status(200).json(history);
    } catch (err) {
      next(err);
    }
  }

  static async submitTakeaway(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookId, text } = req.body;
      const result = await ReadingService.submitTakeaway(req.user!.id, bookId, text);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
