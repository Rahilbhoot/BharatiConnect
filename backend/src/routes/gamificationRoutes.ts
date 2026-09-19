import { Router } from 'express';
import { GamificationController } from '../controllers/gamificationController';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/leaderboard', GamificationController.getLeaderboard);
router.get('/challenges', GamificationController.getActiveChallenges);

export default router;
