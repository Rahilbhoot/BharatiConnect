import { Request, Response, NextFunction } from 'express';
import { PostService } from '../services/postService';

export class AdminPostController {
  static async createNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const notice = await PostService.createNotice(req.body, req.user!.id);
      res.status(201).json(notice);
    } catch (err) {
      next(err);
    }
  }

  static async updateNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const notice = await PostService.updatePost(req.params.id, req.body, req.user!.id);
      res.json(notice);
    } catch (err) {
      next(err);
    }
  }

  static async deleteNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PostService.deletePost(req.params.id, req.user!.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getReadReceipts(req: Request, res: Response, next: NextFunction) {
    try {
      const receipts = await PostService.getReadReceipts(req.params.id);
      res.json(receipts);
    } catch (err) {
      next(err);
    }
  }

  static async createUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await PostService.createUpdate(req.body, req.user!.id);
      res.status(201).json(post);
    } catch (err) {
      next(err);
    }
  }

  static async updatePost(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await PostService.updatePost(req.params.id, req.body, req.user!.id);
      res.json(post);
    } catch (err) {
      next(err);
    }
  }

  static async deletePost(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PostService.deletePost(req.params.id, req.user!.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
