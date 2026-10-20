import { Request, Response, NextFunction } from 'express';
import { BookshelfService } from '../services/bookshelfService';
import { UserBook } from '../models/UserBook';
import { BookStatus } from '@shared/types';
import { NotFoundError } from '../utils/AppError';

export class ShelfController {
  static async getShelf(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as BookStatus | undefined;
      const shelf = await BookshelfService.getShelf(req.user!.id, status);
      res.json(shelf);
    } catch (err) {
      next(err);
    }
  }

  static async addToShelf(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookId, status } = req.body;
      const result = await BookshelfService.addToShelf(req.user!.id, bookId, status);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async updateShelfStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookId } = req.params;
      const { status } = req.body;
      const result = await BookshelfService.updateShelfStatus(req.user!.id, bookId, status);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async rateBook(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookId } = req.params;
      const { rating, review } = req.body;
      const result = await BookshelfService.rateBook(req.user!.id, bookId, rating, review);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async removeFromShelf(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookId } = req.params;
      const deleted = await UserBook.findOneAndDelete({ userId: req.user!.id, bookId });
      if (!deleted) throw new NotFoundError('Book not found in shelf');
      res.json({ message: 'Book removed from shelf' });
    } catch (err) {
      next(err);
    }
  }
}
