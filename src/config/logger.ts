import pino from 'pino';

export function createLogger(level = process.env.LOG_LEVEL ?? 'info') {
  return pino({
    level,
    redact: {
      paths: ['req.headers.authorization', 'GITHUB_TOKEN', 'token'],
      censor: '[REDACTED]',
    },
  });
}

export const logger = createLogger();
