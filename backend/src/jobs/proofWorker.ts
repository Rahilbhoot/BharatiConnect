import { ReadingLog } from '../models/ReadingLog';
import { VisionService } from '../services/visionService';
import { StreakService } from '../services/streakService';
import { ProofOutcome } from '@shared/types';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import axios from 'axios';
import mongoose from 'mongoose';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
});

export class ProofWorker {
  static async processPendingProofs() {
    const pendingLogs = await ReadingLog.find({ 'proof.status': ProofOutcome.NeedsReview, provisional: true }).limit(10);
    
    for (const log of pendingLogs) {
      if (!log.proof || !log.proof.imageRef) continue;

      try {
        const response = await axios.get(log.proof.imageRef, { responseType: 'arraybuffer' });
        const base64Image = Buffer.from(response.data, 'binary').toString('base64');

        const verdict = await VisionService.verifyProof(base64Image);
        
        log.proof.verdict = verdict;
        
        if (verdict.hasBook && verdict.textLegible && verdict.confidence > 0.7) {
          log.proof.status = ProofOutcome.Accepted;
          log.provisional = false;
          
          await StreakService.calculateStreak(log.userId as mongoose.Types.ObjectId, log.date);
        } else {
          log.proof.status = ProofOutcome.Retake;
        }

      } catch (err: any) {
        console.error(`Failed to process proof for log ${log.id}:`, err.message);
        log.proof.attempts = (log.proof.attempts || 0) + 1;
        if (log.proof.attempts > 3) {
           // Wait for manual review
        }
      }

      await log.save();
    }
  }
}
