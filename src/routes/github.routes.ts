import { Router } from 'express';
import type { GitHubController } from '../controllers/github.controller.js';
import { validateUsername } from '../middleware/validate.js';

export function createGitHubRouter(controller: GitHubController): Router {
  const router = Router();
  router.get('/profile/:username', validateUsername, controller.getProfile);
  return router;
}
