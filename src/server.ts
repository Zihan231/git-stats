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

try {
  app = createConfiguredApp().app;
} catch (error) {
  // A serverless module must never terminate its runtime process. Return the public error
  // contract and leave the detailed cause in the protected platform logs instead.
  logger.fatal({ err: error }, 'Application initialization failed');
  app = configurationErrorApp();
}

// Vercel automatically detects this Express export and wraps it as one function.
export default app;
