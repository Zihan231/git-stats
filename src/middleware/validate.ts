import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

const githubUsername = z
  .string()
  .min(1)
  .max(39)
  .regex(/^(?!-)(?!.*--)[A-Za-z0-9-]+(?<!-)$/);

export function validateUsername(req: Request, res: Response, next: NextFunction): void {
  const result = githubUsername.safeParse(req.params.username);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: { message: 'Invalid GitHub username', code: 'INVALID_USERNAME' },
    });
    return;
  }
  req.params.username = result.data;
  next();
}
