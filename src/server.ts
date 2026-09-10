import express, { type Express } from 'express';
import { createConfiguredApp } from './bootstrap.js';
import { logger } from './config/logger.js';

function configurationErrorApp(): Express {
  const fallback = express();
  fallback.use((_req, res) => {
    res.status(503).json({
      success: false,
      error: {
        message: 'Service configuration is incomplete',
        code: 'CONFIGURATION_ERROR',
      },
    });
  });
  return fallback;
}

let app: Express;
let port = Number(process.env.PORT ?? 5000);

try {
  const configured = createConfiguredApp();
  app = configured.app;
  port = configured.config.PORT;
} catch (error) {
  // Still bind a server so Vercel can capture the listener and return a useful error.
  logger.fatal({ err: error }, 'Application initialization failed');
  app = configurationErrorApp();
}

// Vercel captures this listener and routes function invocations through an internal port.
// The numeric port is used directly only when running the application outside Vercel.
const server = app.listen(port, () => {
  logger.info({ port }, 'GitHub Developer Analytics API started');
});

if (process.env.VERCEL !== '1') {
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
}
