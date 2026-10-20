import { Request, Response, NextFunction } from 'express';
import { BookService } from '../services/bookService';

export class BookController {
  static async searchBooks(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query.q as string;
      const lang = req.query.lang as string;
      const results = await BookService.searchGoogleBooks(q, lang);
      res.json(results);
    } catch (err) {
      next(err);
    }
  }

  static async getBookDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const detail = await BookService.getBookDetail(req.params.id);
      res.json(detail);
    } catch (err) {
      next(err);
    }
  }

  static async createManualBook(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, author, totalPages, language, genre, coverUrl } = req.body;
      const book = await BookService.createManualBook(
        title,
        author,
        Number(totalPages),
        language,
        req.user!.id,
        genre,
        coverUrl
      );
      res.status(201).json(book);
    } catch (err) {
      next(err);
    }
  }

  static async getStaffPicks(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const result = await BookService.getStaffPicks(page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getShortReads(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = req.query.lang as string;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const result = await BookService.getShortReads(lang, page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getSuggested(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const result = await BookService.getSuggestedForYou(req.user!.id, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
