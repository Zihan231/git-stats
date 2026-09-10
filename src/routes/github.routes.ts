import { Router } from 'express';
import type { GitHubController } from '../controllers/github.controller';
import { validateUsername } from '../middleware/validate';

export function createGitHubRouter(controller: GitHubController): Router {
  const router = Router();
  router.get('/profile/:username', validateUsername, controller.getProfile);
  return router;
}
