import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

// Placeholder routes for Phase 9 Content (Books, Posts, Videos)
router.get('/posts', (req, res) => res.json([]));
router.post('/posts', (req, res) => res.status(201).json({}));
router.get('/videos', (req, res) => res.json([]));
router.post('/videos', (req, res) => res.status(201).json({}));
router.get('/books', (req, res) => res.json([]));
router.post('/books', (req, res) => res.status(201).json({}));

export default router;
