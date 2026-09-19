import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: [env.FRONTEND_URL, env.ADMIN_URL] }));
  app.use(compression());
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Mount routes
  app.use('/api/auth', require('./routes/authRoutes').default);
  app.use('/api/staff', require('./routes/adminUserRoutes').default);
  app.use('/api/departments', require('./routes/adminDepartmentRoutes').default);
  app.use('/api/owner', require('./routes/ownerRoutes').default);
  app.use('/api/reading', require('./routes/readingRoutes').default);
  app.use('/api/gamification', require('./routes/gamificationRoutes').default);
  app.use('/api/content', require('./routes/contentRoutes').default);
  app.use('/api/admin', require('./routes/adminRoutes').default);

  app.use(errorHandler);

  return app;
}
