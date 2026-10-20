import mongoose from 'mongoose';
import { Post, IPost } from '../models/Post';
import { PostRead } from '../models/PostRead';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { PostType, NoticePriority, Role } from '@shared/types';
import { NotFoundError, ValidationError } from '../utils/AppError';

export class PostService {
  /**
   * PRD Notice-01: Admin creates notice with bilingual title and body
   */
  static async createNotice(data: any, adminId: string, imageUrl?: string): Promise<IPost> {
    if (!data.title?.en && !data.title?.mr) {
      throw new ValidationError('Notice must have at least one title (en or mr)');
    }
    if (!data.body?.en && !data.body?.mr) {
      throw new ValidationError('Notice must have at least one body (en or mr)');
    }

    const post = await Post.create({
      type: PostType.Notice,
      title: {
        en: data.title.en || data.title.mr,
        mr: data.title.mr || data.title.en
      },
      body: {
        en: data.body.en || data.body.mr,
        mr: data.body.mr || data.body.en
      },
      images: imageUrl ? [imageUrl] : (data.images || []),
      priority: data.priority || NoticePriority.Normal,
      pinned: !!data.pinned,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
      createdBy: new mongoose.Types.ObjectId(adminId)
    });

    await AuditLog.create({
      actorId: adminId,
      action: 'CREATE_NOTICE',
      targetType: 'Post',
      targetId: post._id,
      after: post.toObject()
    });

    return post;
  }

  /**
   * PRD Post-01, Post-02: Admin creates general post / update with up to 5 images
   */
  static async createUpdate(data: any, adminId: string, imageUrls?: string[]): Promise<IPost> {
    const images = imageUrls || data.images || [];
    if (images.length > 5) {
      throw new ValidationError('Maximum 5 images allowed per post');
    }

    const post = await Post.create({
      type: PostType.Update,
      title: {
        en: data.title?.en || data.title?.mr || '',
        mr: data.title?.mr || data.title?.en || ''
      },
      body: {
        en: data.body?.en || data.body?.mr || '',
        mr: data.body?.mr || data.body?.en || ''
      },
      images,
      publishedAt: new Date(),
      createdBy: new mongoose.Types.ObjectId(adminId)
    });

    await AuditLog.create({
      actorId: adminId,
      action: 'CREATE_POST',
      targetType: 'Post',
      targetId: post._id,
      after: post.toObject()
    });

    return post;
  }

  /**
   * PRD Notice-02: List notices (pinned first, unexpired) with isRead status for user
   */
  static async listNotices(userId?: string | mongoose.Types.ObjectId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const now = new Date();

    const query: any = {
      type: PostType.Notice,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }]
    };

    const [notices, total] = await Promise.all([
      Post.find(query)
        .sort({ pinned: -1, publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name'),
      Post.countDocuments(query)
    ]);

    let readNoticeIds = new Set<string>();
    if (userId) {
      const reads = await PostRead.find({
        userId,
        postId: { $in: notices.map(n => n._id) }
      });
      readNoticeIds = new Set(reads.map(r => r.postId.toString()));
    }

    const results = notices.map(n => ({
      ...n.toObject(),
      isRead: readNoticeIds.has(n._id.toString())
    }));

    return {
      notices: results,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * PRD Post-03: Chronological feed of updates/posts
   */
  static async listPosts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find({ type: PostType.Update })
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name'),
      Post.countDocuments({ type: PostType.Update })
    ]);

    return {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * PRD Notice-04: Mark notice as read
   */
  static async markRead(postId: string | mongoose.Types.ObjectId, userId: string | mongoose.Types.ObjectId) {
    return await PostRead.findOneAndUpdate(
      { postId, userId },
      { postId, userId, readAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  /**
   * PRD Notice-04: Read receipts for admin view
   */
  static async getReadReceipts(postId: string | mongoose.Types.ObjectId) {
    const post = await Post.findById(postId);
    if (!post) throw new NotFoundError('Post not found');

    const [allStaff, reads] = await Promise.all([
      User.find({ role: Role.Staff, active: true }).select('name email departmentId').populate('departmentId', 'name'),
      PostRead.find({ postId }).populate('userId', 'name email departmentId')
    ]);

    const readUserMap = new Map(reads.map(r => [r.userId._id.toString(), r.readAt]));

    const readList: any[] = [];
    const unreadList: any[] = [];

    for (const staff of allStaff) {
      const readAt = readUserMap.get(staff._id.toString());
      if (readAt) {
        readList.push({ user: staff, readAt });
      } else {
        unreadList.push({ user: staff });
      }
    }

    return {
      totalStaff: allStaff.length,
      readCount: readList.length,
      unreadCount: unreadList.length,
      readPercentage: allStaff.length > 0 ? Math.round((readList.length / allStaff.length) * 100) : 0,
      readList,
      unreadList
    };
  }

  /**
   * Update post
   */
  static async updatePost(postId: string | mongoose.Types.ObjectId, data: any, adminId: string) {
    const post = await Post.findById(postId);
    if (!post) throw new NotFoundError('Post not found');

    const before = post.toObject();

    if (data.title) {
      if (data.title.en) post.title.en = data.title.en;
      if (data.title.mr) post.title.mr = data.title.mr;
    }
    if (data.body) {
      if (data.body.en) post.body.en = data.body.en;
      if (data.body.mr) post.body.mr = data.body.mr;
    }
    if (data.pinned !== undefined) post.pinned = data.pinned;
    if (data.priority !== undefined) post.priority = data.priority;
    if (data.expiresAt !== undefined) post.expiresAt = data.expiresAt ? new Date(data.expiresAt) : undefined;

    await post.save();

    await AuditLog.create({
      actorId: adminId,
      action: 'UPDATE_POST',
      targetType: 'Post',
      targetId: post._id,
      before,
      after: post.toObject()
    });

    return post;
  }

  /**
   * Delete post
   */
  static async deletePost(postId: string | mongoose.Types.ObjectId, adminId: string) {
    const post = await Post.findById(postId);
    if (!post) throw new NotFoundError('Post not found');

    await Post.findByIdAndDelete(postId);
    await PostRead.deleteMany({ postId });

    await AuditLog.create({
      actorId: adminId,
      action: 'DELETE_POST',
      targetType: 'Post',
      targetId: new mongoose.Types.ObjectId(postId)
    });

    return { message: 'Post deleted successfully' };
  }
}
