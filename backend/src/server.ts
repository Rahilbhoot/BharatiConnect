import { env } from './config/env';
import { createApp } from './app';
import { connectDatabase } from './config/database';
import { startScheduler } from './jobs/scheduler';
import { logger } from './config/logger';

async function startServer() {
  await connectDatabase();
  const app = createApp();

  startScheduler();

  app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`, { port: env.PORT, env: env.NODE_ENV });
  });
}

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
