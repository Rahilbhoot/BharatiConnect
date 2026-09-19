import { Router } from 'express';
import { ReadingController } from '../controllers/readingController';
import { authenticate } from '../middleware/authenticate';
import { uploadProof } from '../middleware/upload';
import { checkInLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

const multipartSchema = z.object({
  bookId: z.string(),
  startPage: z.string().regex(/^\d+$/).transform(Number),
  endPage: z.string().regex(/^\d+$/).transform(Number),
  note: z.string().optional()
});

router.post('/', checkInLimiter, uploadProof.single('proof'), validate(multipartSchema), ReadingController.logReading);

export default router;
