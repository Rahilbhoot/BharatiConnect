import { Router } from 'express';
import { AdminProofController } from '../controllers/adminProofController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { Role } from '@shared/types';

const router = Router();
router.use(authenticate, authorize(Role.Admin, Role.Owner));

router.get('/', AdminProofController.getReviewQueue);
router.post('/:id/decision', AdminProofController.submitDecision);

export default router;
