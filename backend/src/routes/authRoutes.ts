import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { loginLimiter, apiLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { Role } from '@shared/types';
import { loginSchema, acceptInviteSchema, refreshSchema, twoFactorVerifySchema } from '../validators/authValidators';

const router = Router();

router.post('/login', loginLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh', apiLimiter, validate(refreshSchema), AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);
router.post('/accept-invite', apiLimiter, validate(acceptInviteSchema), AuthController.acceptInvite);
router.post('/two-factor/login', loginLimiter, AuthController.verifyTwoFactor);

// 2FA Setup for admin/owner
router.post(
  '/two-factor/setup', 
  authenticate, 
  authorize(Role.Admin, Role.Owner), 
  AuthController.setupTwoFactor
);

router.post(
  '/two-factor/verify-setup', 
  authenticate, 
  authorize(Role.Admin, Role.Owner), 
  validate(twoFactorVerifySchema), 
  AuthController.verifyTwoFactorSetup
);

export default router;
