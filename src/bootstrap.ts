import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { AnalyticsService } from './services/analytics.service.js';
import { GitHubService } from './services/github.service.js';

export function createConfiguredApp() {
  const config = loadConfig();
  const githubService = new GitHubService(config.GITHUB_TOKEN);
  const analyticsService = new AnalyticsService(githubService, config.CACHE_TTL_SECONDS * 1000);

  return {
    app: createApp({
      analyticsService,
      corsOrigin: config.CORS_ORIGIN,
      rateLimitWindowMs: config.RATE_LIMIT_WINDOW_MS,
      rateLimitMax: config.RATE_LIMIT_MAX,
    }),
    config,
  };
}
