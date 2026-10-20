import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';

// Route imports
import authRoutes from './routes/authRoutes';
import adminUserRoutes from './routes/adminUserRoutes';
import adminDepartmentRoutes from './routes/adminDepartmentRoutes';
import ownerRoutes from './routes/ownerRoutes';
import readingRoutes from './routes/readingRoutes';
import bookRoutes from './routes/bookRoutes';
import shelfRoutes from './routes/shelfRoutes';
import userRoutes from './routes/userRoutes';
import noticeRoutes from './routes/noticeRoutes';
import postRoutes from './routes/postRoutes';
import videoRoutes from './routes/videoRoutes';
import bookSuggestionRoutes from './routes/bookSuggestionRoutes';
import challengeRoutes from './routes/challengeRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';
import badgeRoutes from './routes/badgeRoutes';
import gamificationRoutes from './routes/gamificationRoutes';

// Admin sub-routes
import adminRoutes from './routes/adminRoutes';
import adminPostRoutes from './routes/adminPostRoutes';
import adminVideoRoutes from './routes/adminVideoRoutes';
import adminSuggestionRoutes from './routes/adminSuggestionRoutes';
import adminProofRoutes from './routes/adminProofRoutes';
import adminChallengeRoutes from './routes/adminChallengeRoutes';

import { authenticate } from './middleware/authenticate';
import { UserController } from './controllers/userController';

export function createApp(): Express {
  const app = express();

  if (env.NODE_ENV === 'development') {
    app.set('etag', false);
  }

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server) or development localhost
        if (
          !origin ||
          origin === env.FRONTEND_URL ||
          origin === env.ADMIN_URL ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          env.NODE_ENV === 'development'
        ) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json());
  app.use(morgan('dev'));

  const healthHandler = (req: express.Request, res: express.Response) => {
    res.json({ status: 'ok' });
  };
  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  // Auth routes
  app.use('/api/auth', authRoutes);

  // User & Department management (Admin)
  app.get('/api/staff/directory', authenticate, UserController.getStaffDirectory);
  app.use('/api/admin/users', adminUserRoutes);
  app.use('/api/staff', adminUserRoutes);
  app.use('/api/admin/departments', adminDepartmentRoutes);
  app.use('/api/departments', adminDepartmentRoutes);

  // Owner admin management
  app.use('/api/owner', ownerRoutes);

  // Personal profile & notifications
  app.use('/api/me/shelf', shelfRoutes);
  app.use('/api/me', userRoutes);

  // Books catalog & personal reading
  app.use('/api/books', bookRoutes);
  app.use('/api/reading', readingRoutes);

  // Content (Notices, Posts, Videos, Book Suggestions)
  app.use('/api/notices', noticeRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/videos', videoRoutes);
  app.use('/api/suggestions/books', bookSuggestionRoutes);

  // Gamification: Challenges, Leaderboards, Badges
  app.use('/api/challenges', challengeRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/badges', badgeRoutes);
  app.use('/api/gamification', gamificationRoutes);

  // Admin dedicated sub-routes
  app.use('/api/admin/proof-reviews', adminProofRoutes);
  app.use('/api/admin/challenges', adminChallengeRoutes);
  app.use('/api/admin/videos', adminVideoRoutes);
  app.use('/api/admin/suggestions', adminSuggestionRoutes);
  app.use('/api/admin', adminPostRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(errorHandler);

  return app;
}
