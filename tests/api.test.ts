import request from 'supertest';
import { createApp } from '../src/app';
import { AnalyticsService } from '../src/services/analytics.service';
import type { GitHubDataSource } from '../src/services/github.service';
import type { GitHubRawData } from '../src/types/github';
import { NotFoundError } from '../src/utils/errors';

const rawData: GitHubRawData = {
  profile: {
    username: 'octocat',
    name: 'The Octocat',
    avatar: 'https://example.com/avatar.png',
    bio: 'GitHub mascot',
    followers: 100,
    following: 2,
  },
  contributionDays: [
    { date: '2026-09-08', contributionCount: 2, weekday: 2 },
    { date: '2026-09-09', contributionCount: 4, weekday: 3 },
  ],
  totalContributions: 100,
  totalRepositories: 2,
  repositories: [
    {
      name: 'hello-world',
      owner: 'octocat',
      stars: 60,
      forks: 5,
      isFork: false,
      languages: [
        { name: 'TypeScript', bytes: 750 },
        { name: 'JavaScript', bytes: 250 },
      ],
    },
  ],
  events: [{ type: 'PushEvent', createdAt: '2026-09-09T23:00:00Z', repositoryOwner: 'community' }],
};

describe('GitHub profile API', () => {
  it('returns the documented response and caches repeated usernames', async () => {
    const dataSource: GitHubDataSource = { getDeveloperData: jest.fn().mockResolvedValue(rawData) };
    const app = createApp({
      analyticsService: new AnalyticsService(dataSource),
      rateLimitMax: 1000,
    });

    const first = await request(app).get('/api/github/profile/Octocat');
    const second = await request(app).get('/api/github/profile/octocat');

    expect(first.status).toBe(200);
    expect(first.body.success).toBe(true);
    expect(first.body.data).toMatchObject({
      profile: { username: 'octocat' },
      activity: { totalContributions: 100, mostActiveDay: 'Wednesday' },
      repositories: {
        totalRepositories: 2,
        totalStars: 60,
        totalForks: 5,
        mostStarredRepository: { name: 'hello-world', stars: 60 },
      },
      languages: [
        { name: 'TypeScript', percentage: 75 },
        { name: 'JavaScript', percentage: 25 },
      ],
    });
    expect(second.status).toBe(200);
    expect(dataSource.getDeveloperData).toHaveBeenCalledTimes(1);
  });

  it.each(['-bad', 'bad-', 'two--dashes', 'space user', 'x'.repeat(40)])(
    'rejects invalid username %s',
    async (username) => {
      const dataSource: GitHubDataSource = { getDeveloperData: jest.fn() };
      const app = createApp({ analyticsService: new AnalyticsService(dataSource) });
      const response = await request(app).get(
        `/api/github/profile/${encodeURIComponent(username)}`,
      );
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: { message: 'Invalid GitHub username', code: 'INVALID_USERNAME' },
      });
    },
  );

  it('normalizes operational errors without leaking internals', async () => {
    const dataSource: GitHubDataSource = {
      getDeveloperData: jest.fn().mockRejectedValue(new NotFoundError()),
    };
    const app = createApp({ analyticsService: new AnalyticsService(dataSource) });
    const response = await request(app).get('/api/github/profile/missing');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: { message: 'GitHub user not found', code: 'USER_NOT_FOUND' },
    });
  });

  it('provides a health endpoint', async () => {
    const dataSource: GitHubDataSource = { getDeveloperData: jest.fn() };
    const app = createApp({ analyticsService: new AnalyticsService(dataSource) });
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: { status: 'ok' } });
  });
});
