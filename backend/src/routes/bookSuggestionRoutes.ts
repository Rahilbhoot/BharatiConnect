import { Router } from 'express';
import { BookSuggestionController } from '../controllers/bookSuggestionController';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { bookSuggestionSchema } from '../validators/contentValidators';

const router = Router();
router.use(authenticate);

router.get('/', BookSuggestionController.listSuggestions);
router.post('/', validate(bookSuggestionSchema), BookSuggestionController.submitSuggestion);

export default router;
