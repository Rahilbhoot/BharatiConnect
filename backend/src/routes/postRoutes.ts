import { Router } from 'express';
import { PostController } from '../controllers/postController';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', PostController.listPosts);

export default router;
