import { env } from './config/env';
import { createApp } from './app';
import { connectDatabase } from './config/database';

async function startServer() {
  await connectDatabase();
  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
