import { ProofReviewService } from '../services/proofReviewService';

export class CleanupExpiredPhotosJob {
  /**
   * PRD Section 7.6: Delete photos for needs_review proofs older than 7 days and auto-accept
   */
  static async runCleanup() {
    const cleanedCount = await ProofReviewService.cleanupExpiredPhotos();
    if (cleanedCount > 0) {
      console.log(`[CleanupExpiredPhotosJob] Cleaned up and auto-accepted ${cleanedCount} expired review items.`);
    }
    return cleanedCount;
  }
}
