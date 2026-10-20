import { Router } from 'express';
import { BookController } from '../controllers/bookController';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { manualBookSchema } from '../validators/readingValidators';

const router = Router();
router.use(authenticate);

router.get('/search', BookController.searchBooks);
router.get('/staff-picks', BookController.getStaffPicks);
router.get('/short-reads', BookController.getShortReads);
router.get('/suggested', BookController.getSuggested);
router.get('/:id', BookController.getBookDetail);
router.post('/', validate(manualBookSchema), BookController.createManualBook);

export default router;
