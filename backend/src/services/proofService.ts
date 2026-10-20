import crypto from 'crypto';
import mongoose from 'mongoose';
import { cloudinary } from '../config/cloudinary';
import { logger } from '../config/logger';
import { ReadingLog } from '../models/ReadingLog';
import { Settings } from '../models/Settings';
import { VisionService, Verdict } from './visionService';
import { ProofDecisionService, DecisionResult } from './proofDecisionService';
import { ProofOutcome } from '@shared/types';
import { ValidationError } from '../utils/AppError';
import { getTodayDateString } from '../utils/dateUtils';

export class ProofService {
  /**
   * Helper to upload buffer to Cloudinary privately
   */
  private static async uploadToCloudinary(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'bharati_proofs', resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result?.secure_url || '');
        }
      );
      uploadStream.end(buffer);
    });
  }

  /**
   * Process a proof photo through the full PRD Section 7 pipeline
   */
  static async processProof(
    userId: string | mongoose.Types.ObjectId,
    bookId: string | mongoose.Types.ObjectId,
    currentPage: number,
    photoBuffer: Buffer
  ): Promise<{
    decision: DecisionResult;
    verdict?: Verdict;
    imageHash: string;
    imageRef?: string;
    spotCheck: boolean;
  }> {
    const todayStr = getTodayDateString();

    // 1. Abuse check: Max 10 photo submissions per day (PRD 7.5)
    const todayLogsWithProof = await ReadingLog.find({
      userId,
      date: todayStr,
      'proof.attempts': { $exists: true }
    });
    const totalAttemptsToday = todayLogsWithProof.reduce(
      (sum, l) => sum + (l.proof?.attempts || 0),
      0
    );
    if (totalAttemptsToday >= 10) {
      throw new ValidationError('Daily photo proof limit reached (maximum 10 photos per day).');
    }

    // 2. Compute SHA-256 hash of the photo (PRD 7.3)
    const imageHash = crypto.createHash('sha256').update(photoBuffer).digest('hex');

    // 3. Duplicate photo check against earlier proofs (PRD 7.3)
    const existingWithHash = await ReadingLog.findOne({
      'proof.imageHash': imageHash,
      date: { $ne: todayStr }
    });
    const isDuplicate = !!existingWithHash;

    // 4. Count retakes today for this user
    const retakeCountToday = todayLogsWithProof.filter(
      l => l.proof?.status === ProofOutcome.Retake
    ).length;

    // 5. Look up last proven page for this book
    const lastProvenLog = await ReadingLog.findOne({
      userId,
      bookId,
      'proof.status': ProofOutcome.Accepted,
      'proof.verdict.printedPageNumber': { $exists: true, $ne: null }
    }).sort({ 'proof.verdict.printedPageNumber': -1 });

    const lastProvenPage = lastProvenLog?.proof?.verdict?.printedPageNumber;

    // 6. Call vision model with 15-second timeout (PRD 7.5)
    let verdict: Verdict | null = null;
    let modelFailed = false;

    try {
      const base64Image = photoBuffer.toString('base64');
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Vision model timed out after 15s')), 15000)
      );

      verdict = await Promise.race([
        VisionService.verifyProof(base64Image),
        timeoutPromise
      ]);
    } catch (err: any) {
      console.warn('Vision model call failed or timed out:', err.message);
      modelFailed = true;
    }

    // 7. If model failed or timed out, outcome is automatically needs_review (PRD 7.5)
    let decision: DecisionResult;
    if (modelFailed || !verdict) {
      decision = {
        outcome: ProofOutcome.NeedsReview,
        reason: 'Automated verification unavailable; queued for manual review.'
      };
    } else {
      decision = ProofDecisionService.decide({
        verdict,
        claimedPage: currentPage,
        lastProvenPage,
        isDuplicatePhoto: isDuplicate,
        retakeCountToday
      });
    }

    // 8. 5% spot check lottery for accepted proofs (PRD 7.5)
    const settings = await Settings.findOne();
    const spotCheckRate = settings?.spotCheckRate ?? 0.05;
    const isSpotCheck = decision.outcome === ProofOutcome.Accepted && Math.random() < spotCheckRate;

    // 9. Store photo if needs_review or spot check (PRD 7.6)
    let imageRef: string | undefined;
    if (decision.outcome === ProofOutcome.NeedsReview || isSpotCheck) {
      try {
        imageRef = await this.uploadToCloudinary(photoBuffer);
      } catch (uploadErr: any) {
        logger.warn('Failed to upload proof photo to Cloudinary:', { error: uploadErr.message });
      }
    }

    return {
      decision,
      verdict: verdict || undefined,
      imageHash,
      imageRef,
      spotCheck: isSpotCheck
    };
  }
}
