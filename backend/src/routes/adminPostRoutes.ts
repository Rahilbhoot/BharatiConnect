import { Router } from 'express';
import { AdminPostController } from '../controllers/adminPostController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createNoticeSchema, updateNoticeSchema, createPostSchema } from '../validators/contentValidators';
import { Role } from '@shared/types';

const router = Router();
router.use(authenticate, authorize(Role.Admin, Role.Owner));

// Notices
router.post('/notices', validate(createNoticeSchema), AdminPostController.createNotice);
router.patch('/notices/:id', validate(updateNoticeSchema), AdminPostController.updateNotice);
router.delete('/notices/:id', AdminPostController.deleteNotice);
router.get('/notices/:id/reads', AdminPostController.getReadReceipts);

// Posts
router.post('/posts', validate(createPostSchema), AdminPostController.createUpdate);
router.patch('/posts/:id', AdminPostController.updatePost);
router.delete('/posts/:id', AdminPostController.deletePost);

export default router;
