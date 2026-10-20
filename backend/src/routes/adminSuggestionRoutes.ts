import { Router } from 'express';
import { BookSuggestionController } from '../controllers/bookSuggestionController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { reviewSuggestionSchema } from '../validators/contentValidators';
import { Role } from '@shared/types';

const router = Router();
router.use(authenticate, authorize(Role.Admin, Role.Owner));

router.patch('/:id', validate(reviewSuggestionSchema), BookSuggestionController.reviewSuggestion);

export default router;
