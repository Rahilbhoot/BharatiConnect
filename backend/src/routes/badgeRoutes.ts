import { Router } from 'express';
import { BadgeController } from '../controllers/badgeController';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/me', BadgeController.getUserBadges);
router.get('/', BadgeController.listAllBadges);

export default router;
