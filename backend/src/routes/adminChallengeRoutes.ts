import { Router } from 'express';
import { ChallengeController } from '../controllers/challengeController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createChallengeSchema } from '../validators/challengeValidators';
import { Role } from '@shared/types';

const router = Router();
router.use(authenticate, authorize(Role.Admin, Role.Owner));

router.post('/', validate(createChallengeSchema), ChallengeController.createChallenge);
router.delete('/:id', ChallengeController.deactivateChallenge);

export default router;
