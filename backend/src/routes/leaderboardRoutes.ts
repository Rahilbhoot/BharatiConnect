import { Router } from 'express';
import { GamificationController } from '../controllers/gamificationController';
import { LeaderboardService } from '../services/leaderboardService';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', GamificationController.getLeaderboard);
router.get('/reader-of-the-month', async (req, res, next) => {
  try {
    const winner = await LeaderboardService.getReaderOfMonth();
    res.json(winner || { message: 'No winner computed for previous month yet' });
  } catch (err) {
    next(err);
  }
});

export default router;
