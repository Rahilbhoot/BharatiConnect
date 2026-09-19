import { Request, Response, NextFunction } from 'express';
import { ReadingService } from '../services/readingService';

export class ReadingController {
  static async logReading(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookId, startPage, endPage, note } = req.body;
      const file = req.file;

      const result = await ReadingService.logReading(
        req.user!.id, 
        bookId, 
        parseInt(startPage), 
        parseInt(endPage), 
        note, 
        file
      );

      res.status(201).json(result);
    } catch (err) { next(err); }
  }
}
