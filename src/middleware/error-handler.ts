import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'Route not found', code: 'ROUTE_NOT_FOUND' },
  });
};

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  const appError = error instanceof AppError ? error : null;
  logger[appError ? 'warn' : 'error'](
    { err: error, method: req.method, path: req.path },
    appError ? 'Request failed' : 'Unexpected request failure',
  );

  res.status(appError?.statusCode ?? 500).json({
    success: false,
    error: {
      message: appError?.message ?? 'Internal server error',
      code: appError?.code ?? 'INTERNAL_ERROR',
    },
  });
};
