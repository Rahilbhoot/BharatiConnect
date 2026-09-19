import { Router } from 'express';
import { OwnerController } from '../controllers/ownerController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { Role } from '@shared/types';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = Router();

// Only Owners can access
router.use(authenticate, authorize(Role.Owner));

const createAdminSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8)
});

router.post('/admins', validate(createAdminSchema), OwnerController.createAdmin);
router.delete('/admins/:id', OwnerController.removeAdmin);

export default router;
