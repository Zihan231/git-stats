import type { NextFunction, Request, Response } from 'express';
import type { AnalyticsService } from '../services/analytics.service.js';

export class GitHubController {
  constructor(private readonly analytics: AnalyticsService) {}

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const username = req.params.username;
      const data = await this.analytics.getProfile(
        Array.isArray(username) ? (username[0] ?? '') : (username ?? ''),
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
