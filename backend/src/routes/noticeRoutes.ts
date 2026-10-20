import { Router } from 'express';
import { NoticeController } from '../controllers/noticeController';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', NoticeController.listNotices);
router.post('/:id/read', NoticeController.markRead);

export default router;
