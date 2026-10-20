import { Request, Response, NextFunction } from 'express';
import { VideoService } from '../services/videoService';
import { Video } from '../models/Video';
import { VideoView } from '../models/VideoView';
import { AuditLog } from '../models/AuditLog';
import { VideoCategory, Language } from '@shared/types';
import { NotFoundError } from '../utils/AppError';
import mongoose from 'mongoose';

export class VideoController {
  static async listVideos(req: Request, res: Response, next: NextFunction) {
    try {
      const category = req.query.category as VideoCategory | undefined;
      const language = req.query.language as Language | undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await VideoService.listVideos(category, language, req.user?.id, page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async markWatched(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await VideoService.markWatched(req.params.id, req.user!.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async addVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const { youtubeLink, category, language, description } = req.body;
      const video = await VideoService.addVideo(
        youtubeLink,
        category,
        language,
        description,
        req.user!.id
      );
      res.status(201).json(video);
    } catch (err) {
      next(err);
    }
  }

  static async pinVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const { weekString } = req.body;
      const video = await VideoService.pinVideo(req.params.id, weekString, req.user!.id);
      res.json(video);
    } catch (err) {
      next(err);
    }
  }

  static async deleteVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const video = await Video.findByIdAndDelete(req.params.id);
      if (!video) throw new NotFoundError('Video not found');

      await VideoView.deleteMany({ videoId: req.params.id });

      await AuditLog.create({
        actorId: new mongoose.Types.ObjectId(req.user!.id),
        action: 'DELETE_VIDEO',
        targetType: 'Video',
        targetId: new mongoose.Types.ObjectId(req.params.id)
      });

      res.json({ message: 'Video deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
