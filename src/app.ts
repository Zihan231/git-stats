import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { GitHubController } from './controllers/github.controller.js';
import { logger } from './config/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { createGitHubRouter } from './routes/github.routes.js';
import type { AnalyticsService } from './services/analytics.service.js';

export interface AppOptions {
  analyticsService: AnalyticsService;
  corsOrigin?: string;
  rateLimitWindowMs?: number;
  rateLimitMax?: number;
}

export function createApp(options: AppOptions): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin:
        options.corsOrigin === '*' || !options.corsOrigin ? '*' : options.corsOrigin.split(','),
      methods: ['GET'],
    }),
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(pinoHttp({ logger }));
  app.use(
    rateLimit({
      windowMs: options.rateLimitWindowMs ?? 15 * 60 * 1000,
      limit: options.rateLimitMax ?? 100,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({
          success: false,
          error: { message: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
        });
      },
    }),
  );

  app.get('/health', (_req, res) =>
    res.status(200).json({ success: true, data: { status: 'ok' } }),
  );
  app.use('/api/github', createGitHubRouter(new GitHubController(options.analyticsService)));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
