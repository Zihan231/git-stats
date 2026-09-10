import { createConfiguredApp } from './bootstrap';
import { logger } from './config/logger';

try {
  const { app, config } = createConfiguredApp();
  const server = app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, 'GitHub Developer Analytics API started');
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close((error) => {
      if (error) {
        logger.error({ err: error }, 'Graceful shutdown failed');
        process.exitCode = 1;
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
} catch (error) {
  logger.fatal({ err: error }, 'Application startup failed');
  process.exitCode = 1;
}
