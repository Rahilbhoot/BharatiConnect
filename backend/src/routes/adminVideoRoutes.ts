import { Router } from 'express';
import { VideoController } from '../controllers/videoController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { addVideoSchema } from '../validators/contentValidators';
import { Role } from '@shared/types';

const router = Router();
router.use(authenticate, authorize(Role.Admin, Role.Owner));

router.post('/', validate(addVideoSchema), VideoController.addVideo);
router.post('/:id/pin', VideoController.pinVideo);
router.delete('/:id', VideoController.deleteVideo);

export default router;
