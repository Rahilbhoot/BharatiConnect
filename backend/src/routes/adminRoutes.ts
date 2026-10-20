import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { updateSettingsSchema } from '../validators/settingsValidators';
import { addHolidaySchema, addMissedDaySchema } from '../validators/holidayValidators';
import { Role } from '@shared/types';

const router = Router();
router.use(authenticate, authorize(Role.Admin, Role.Owner));

router.get('/dashboard', AdminController.getDashboard);
router.get('/settings', AdminController.getSettings);
router.patch('/settings', validate(updateSettingsSchema), AdminController.updateSettings);
router.get('/reports/reading', AdminController.getReadingReport);
router.get('/audit-logs', AdminController.getAuditLogs);
router.post('/holidays', validate(addHolidaySchema), AdminController.addHoliday);
router.get('/holidays', AdminController.listHolidays);
router.delete('/holidays/:id', AdminController.removeHoliday);
router.post('/reading/add-day', validate(addMissedDaySchema), AdminController.addMissedDay);

export default router;
