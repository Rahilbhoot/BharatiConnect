import axios from 'axios';
import mongoose from 'mongoose';
import { Video, IVideo } from '../models/Video';
import { VideoView } from '../models/VideoView';
import { AuditLog } from '../models/AuditLog';
import { PointsService } from './pointsService';
import { VideoCategory, Language } from '@shared/types';
import { NotFoundError, ValidationError, ConflictError } from '../utils/AppError';

export class VideoService {
  /**
   * Helper to parse YouTube ID from link
   */
  static extractYouTubeId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }

  /**
   * PRD Video-01, Video-02: Add AI video with YouTube oEmbed title/thumbnail
   */
  static async addVideo(
    youtubeLink: string,
    category: VideoCategory,
    language: Language,
    description: { en: string; mr: string },
    adminId: string
  ): Promise<IVideo> {
    const youtubeId = this.extractYouTubeId(youtubeLink);
    if (!youtubeId) throw new ValidationError('Invalid YouTube URL');

    const existing = await Video.findOne({ youtubeId });
    if (existing) throw new ConflictError('This video has already been added');

    let title = 'AI Learning Video';
    let thumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

    try {
      const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;
      const res = await axios.get(oEmbedUrl, { timeout: 4000 });
      if (res.data?.title) title = res.data.title;
      if (res.data?.thumbnail_url) thumbnail = res.data.thumbnail_url;
    } catch {
      // Use fallback thumbnail and title
    }

    const video = await Video.create({
      youtubeId,
      title,
      thumbnail,
      category,
      language,
      description: {
        en: description.en || description.mr,
        mr: description.mr || description.en
      },
      createdBy: new mongoose.Types.ObjectId(adminId)
    });

    await AuditLog.create({
      actorId: adminId,
      action: 'ADD_VIDEO',
      targetType: 'Video',
      targetId: video._id,
      after: video.toObject()
    });

    return video;
  }

  /**
   * PRD Video-03: List AI videos with filters and watched status
   */
  static async listVideos(
    category?: VideoCategory,
    language?: Language,
    userId?: string | mongoose.Types.ObjectId,
    page = 1,
    limit = 20
  ) {
    const filter: any = {};
    if (category) filter.category = category;
    if (language) filter.language = language;

    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .sort({ pinnedWeek: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Video.countDocuments(filter)
    ]);

    let watchedVideoIds = new Set<string>();
    if (userId) {
      const views = await VideoView.find({
        userId,
        videoId: { $in: videos.map(v => v._id) }
      });
      watchedVideoIds = new Set(views.map(v => v.videoId.toString()));
    }

    const results = videos.map(v => ({
      ...v.toObject(),
      watched: watchedVideoIds.has(v._id.toString())
    }));

    return {
      videos: results,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * PRD Video-04 & Section 8: Mark video watched and award 5 points
   */
  static async markWatched(
    videoId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId
  ) {
    const video = await Video.findById(videoId);
    if (!video) throw new NotFoundError('Video not found');

    const existingView = await VideoView.findOne({ videoId, userId });
    if (!existingView) {
      await VideoView.create({ videoId, userId, watchedAt: new Date() });
      await PointsService.awardPoints(userId, 5, 'video_watched', String(videoId), 'Video');
    }

    return { message: 'Video marked as watched', watched: true };
  }

  /**
   * PRD Video-04: View count for admin
   */
  static async getWatchCounts(videoId: string | mongoose.Types.ObjectId) {
    const count = await VideoView.countDocuments({ videoId });
    return { videoId, watchCount: count };
  }

  /**
   * PRD Video-05: Pin video of the week
   */
  static async pinVideo(
    videoId: string | mongoose.Types.ObjectId,
    weekString: string,
    adminId: string
  ) {
    const video = await Video.findById(videoId);
    if (!video) throw new NotFoundError('Video not found');

    video.pinnedWeek = weekString;
    await video.save();

    await AuditLog.create({
      actorId: adminId,
      action: 'PIN_VIDEO',
      targetType: 'Video',
      targetId: video._id,
      after: { pinnedWeek: weekString }
    });

    return video;
  }
}
