import { Router } from 'express';
import { ReadingController } from '../controllers/readingController';
import { authenticate } from '../middleware/authenticate';
import { uploadProof } from '../middleware/upload';
import { checkInLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

const checkInSchema = z.object({
  bookId: z.string(),
  currentPage: z.string().regex(/^\d+$/).transform(Number).optional(),
  endPage: z.string().regex(/^\d+$/).transform(Number).optional(),
  startPage: z.string().regex(/^\d+$/).transform(Number).optional(),
  note: z.string().max(280).optional()
}).refine(data => data.currentPage !== undefined || data.endPage !== undefined, {
  message: 'currentPage is required'
});

const takeawaySchema = z.object({
  bookId: z.string(),
  text: z.string().min(1).max(280)
});

// PRD Section 11: /reading/check-in
router.post('/check-in', checkInLimiter, uploadProof.single('proof'), validate(checkInSchema), ReadingController.checkIn);
router.post('/', checkInLimiter, uploadProof.single('proof'), validate(checkInSchema), ReadingController.checkIn);

// Reading history & streak & takeaway endpoints
router.get('/me/streak', ReadingController.getStreak);
router.get('/me/history', ReadingController.getHistory);
router.post('/me/takeaway', validate(takeawaySchema), ReadingController.submitTakeaway);

export default router;
