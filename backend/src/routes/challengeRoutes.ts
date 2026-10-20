import { Router } from 'express';
import { ChallengeController } from '../controllers/challengeController';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', ChallengeController.listActiveChallenges);
router.get('/:id', ChallengeController.getChallengeDetail);
router.post('/:id/join', ChallengeController.joinChallenge);

export default router;
