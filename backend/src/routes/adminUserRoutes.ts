import { Router } from 'express';
import { StaffController } from '../controllers/staffController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createStaffSchema, updateStaffSchema } from '../validators/staffValidators';
import { Role } from '@shared/types';

const router = Router();

// Only Admins and Owners can manage staff
router.use(authenticate, authorize(Role.Admin, Role.Owner));

router.post('/', validate(createStaffSchema), StaffController.createStaff);
router.get('/', StaffController.listStaff);
router.get('/:id', StaffController.getStaffDetail);
router.put('/:id', validate(updateStaffSchema), StaffController.updateStaff);
router.post('/:id/invite', StaffController.sendInvite);
router.post('/:id/deactivate', StaffController.deactivateStaff);
router.post('/:id/reactivate', StaffController.reactivateStaff);

export default router;
