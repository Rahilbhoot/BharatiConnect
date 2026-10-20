import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/profile', UserController.getProfile);
router.patch('/profile', UserController.updateProfile);
router.post('/push-token', UserController.registerPushToken);
router.get('/notifications', UserController.getNotifications);
router.post('/notifications/:id/read', UserController.markNotificationRead);
router.post('/notifications/read-all', UserController.markAllNotificationsRead);
router.post('/photo-consent', UserController.recordPhotoConsent);
router.get('/points-history', UserController.getPointsHistory);
router.get('/directory', UserController.getStaffDirectory);

export default router;
