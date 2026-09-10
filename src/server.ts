import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { logger } from './config/logger.js';
import { AnalyticsService } from './services/analytics.service.js';
import { GitHubService } from './services/github.service.js';

try {
  const config = loadConfig();
  const githubService = new GitHubService(config.GITHUB_TOKEN);
  const analyticsService = new AnalyticsService(githubService, config.CACHE_TTL_SECONDS * 1000);
  const app = createApp({
    analyticsService,
    corsOrigin: config.CORS_ORIGIN,
    rateLimitWindowMs: config.RATE_LIMIT_WINDOW_MS,
    rateLimitMax: config.RATE_LIMIT_MAX,
  });

  const server = app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, 'GitHub Developer Analytics API started');
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close((error) => {
      if (error) {
        logger.error({ err: error }, 'Graceful shutdown failed');
        process.exit(1);
      }
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
} catch (error) {
  logger.fatal({ err: error }, 'Application startup failed');
  process.exit(1);
}
