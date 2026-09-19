import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { Role } from '@shared/types';

const router = Router();
router.use(authenticate, authorize(Role.Admin, Role.Owner));

// Placeholder routes for Phase 10 Admin/Settings
router.get('/dashboard', (req, res) => res.json({ stats: {} }));
router.get('/settings', (req, res) => res.json({}));
router.put('/settings', (req, res) => res.json({}));
router.get('/reports', (req, res) => res.json([]));

export default router;
