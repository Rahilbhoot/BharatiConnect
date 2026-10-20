import { Router } from 'express';
import { VideoController } from '../controllers/videoController';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', VideoController.listVideos);
router.post('/:id/watched', VideoController.markWatched);

export default router;
