import type { Request, Response } from 'express';
import type { Express } from 'express';
import { createConfiguredApp } from '../src/bootstrap.js';
import { logger } from '../src/config/logger.js';

let app: Express | undefined;

try {
  app = createConfiguredApp().app;
} catch (error) {
  // Keep the serverless function alive so configuration failures return the public API
  // error contract instead of Vercel's opaque FUNCTION_INVOCATION_FAILED page.
  logger.fatal({ err: error }, 'Serverless application initialization failed');
}

export const config = { maxDuration: 30 };

export default function handler(req: Request, res: Response): void {
  if (!app) {
    res.status(503).json({
      success: false,
      error: {
        message: 'Service configuration is incomplete',
        code: 'CONFIGURATION_ERROR',
      },
    });
    return;
  }

  app(req, res);
}
