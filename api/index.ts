import type { Express, Request, Response } from 'express';
import { createConfiguredApp } from '../src/bootstrap';

let app: Express | undefined;
let initializationFailed = false;

export default function handler(req: Request, res: Response): void {
  // Initialize within the invocation so configuration failures are caught by the function
  // instead of aborting module loading with FUNCTION_INVOCATION_FAILED.
  if (!app && !initializationFailed) {
    try {
      app = createConfiguredApp().app;
    } catch (error) {
      initializationFailed = true;
      console.error('Serverless application initialization failed', error);
    }
  }

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
