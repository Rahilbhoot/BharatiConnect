import { Request, Response, NextFunction } from 'express';
import { BookSuggestionService } from '../services/bookSuggestionService';
import { Role, SuggestionStatus } from '@shared/types';

export class BookSuggestionController {
  static async listSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const isStaff = req.user?.role === Role.Staff;
      const userId = isStaff ? req.user!.id : (req.query.userId as string | undefined);
      const status = req.query.status as SuggestionStatus | undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await BookSuggestionService.listSuggestions(userId, status, page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async submitSuggestion(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, author, reason, language } = req.body;
      const suggestion = await BookSuggestionService.submitSuggestion(
        req.user!.id,
        title,
        author,
        reason,
        language
      );
      res.status(201).json(suggestion);
    } catch (err) {
      next(err);
    }
  }

  static async reviewSuggestion(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, createAsStaffPick } = req.body;
      const result = await BookSuggestionService.reviewSuggestion(
        req.params.id,
        status,
        req.user!.id,
        createAsStaffPick
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
