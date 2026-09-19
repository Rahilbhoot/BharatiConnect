import { Router } from 'express';
import { DepartmentController } from '../controllers/departmentController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { departmentSchema } from '../validators/staffValidators';
import { Role } from '@shared/types';

const router = Router();

// Only Admins and Owners can manage departments
router.use(authenticate, authorize(Role.Admin, Role.Owner));

router.post('/', validate(departmentSchema), DepartmentController.createDepartment);
router.get('/', DepartmentController.listDepartments);
router.put('/:id', validate(departmentSchema), DepartmentController.updateDepartment);
router.delete('/:id', DepartmentController.deleteDepartment);

export default router;
