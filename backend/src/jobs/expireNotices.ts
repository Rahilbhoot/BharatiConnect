import { Post } from '../models/Post';
import { PostType } from '@shared/types';

export class ExpireNoticesJob {
  /**
   * PRD Notice-02: Daily check to unpin and process expired notices
   */
  static async runExpireNotices() {
    const now = new Date();
    const result = await Post.updateMany(
      {
        type: PostType.Notice,
        expiresAt: { $lte: now },
        pinned: true
      },
      {
        pinned: false
      }
    );

    return result.modifiedCount;
  }
}
