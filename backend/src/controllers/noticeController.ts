import { Request, Response, NextFunction } from 'express';
import { PostService } from '../services/postService';

export class NoticeController {
  static async listNotices(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const result = await PostService.listNotices(req.user?.id, page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PostService.markRead(req.params.id, req.user!.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
