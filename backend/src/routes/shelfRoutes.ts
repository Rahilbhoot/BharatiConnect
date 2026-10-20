import { Router } from 'express';
import { ShelfController } from '../controllers/shelfController';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { shelfActionSchema, updateShelfStatusSchema, rateBookSchema } from '../validators/readingValidators';

const router = Router();
router.use(authenticate);

router.get('/', ShelfController.getShelf);
router.post('/', validate(shelfActionSchema), ShelfController.addToShelf);
router.patch('/:bookId', validate(updateShelfStatusSchema), ShelfController.updateShelfStatus);
router.post('/:bookId/rate', validate(rateBookSchema), ShelfController.rateBook);
router.delete('/:bookId', ShelfController.removeFromShelf);

export default router;
