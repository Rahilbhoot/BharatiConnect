import { Request, Response, NextFunction } from 'express';
import { PostService } from '../services/postService';

export class PostController {
  static async listPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const result = await PostService.listPosts(page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
