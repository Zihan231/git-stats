import { Octokit } from '@octokit/rest';
import { PROFILE_QUERY } from '../graphql/profile.query.js';
import type {
  ContributionDay,
  GitHubEvent,
  GitHubRawData,
  GitHubRepository,
} from '../types/github.js';
import { GitHubApiError, GitHubRateLimitError, NotFoundError } from '../utils/errors.js';

interface GraphQLRepositoryNode {
  name: string;
  isFork: boolean;
  stargazerCount: number;
  forkCount: number;
  owner: { login: string };
  languages: { edges: Array<{ size: number; node: { name: string } }> };
}

interface ProfileQueryResult {
  user: null | {
    login: string;
    name: string | null;
    avatarUrl: string;
    bio: string | null;
    followers: { totalCount: number };
    following: { totalCount: number };
    contributionsCollection: {
      contributionCalendar: {
        totalContributions: number;
        weeks: Array<{ contributionDays: ContributionDay[] }>;
      };
    };
    repositories: {
      totalCount: number;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: GraphQLRepositoryNode[];
    };
  };
}

export interface GitHubDataSource {
  getDeveloperData(username: string): Promise<GitHubRawData>;
}

export class GitHubService implements GitHubDataSource {
  private readonly octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token, userAgent: 'github-developer-analytics/1.0.0' });
  }

  async getDeveloperData(username: string): Promise<GitHubRawData> {
    try {
      const now = new Date();
      const from = new Date(now);
      from.setUTCFullYear(from.getUTCFullYear() - 1);

      let after: string | null = null;
      let firstResult: ProfileQueryResult | undefined;
      const repositories: GitHubRepository[] = [];

      do {
        const result: ProfileQueryResult = await this.octokit.graphql(PROFILE_QUERY, {
          login: username,
          from: from.toISOString(),
          to: now.toISOString(),
          after,
        });
        firstResult ??= result;
        if (!result.user) throw new NotFoundError();
        repositories.push(...result.user.repositories.nodes.map(this.mapRepository));
        after = result.user.repositories.pageInfo.hasNextPage
          ? result.user.repositories.pageInfo.endCursor
          : null;
      } while (after);

      const user = firstResult?.user;
      if (!user) throw new NotFoundError();

      const events = await this.fetchPublicEvents(username);
      const calendar = user.contributionsCollection.contributionCalendar;
      return {
        profile: {
          username: user.login,
          name: user.name ?? '',
          avatar: user.avatarUrl,
          bio: user.bio ?? '',
          followers: user.followers.totalCount,
          following: user.following.totalCount,
        },
        contributionDays: calendar.weeks.flatMap((week) => week.contributionDays),
        totalContributions: calendar.totalContributions,
        repositories,
        totalRepositories: user.repositories.totalCount,
        events,
      };
    } catch (error: unknown) {
      this.translateError(error);
    }
  }

  private readonly mapRepository = (repository: GraphQLRepositoryNode): GitHubRepository => ({
    name: repository.name,
    owner: repository.owner.login,
    stars: repository.stargazerCount,
    forks: repository.forkCount,
    isFork: repository.isFork,
    languages: repository.languages.edges.map((edge) => ({
      name: edge.node.name,
      bytes: edge.size,
    })),
  });

  private async fetchPublicEvents(username: string): Promise<GitHubEvent[]> {
    const response = await this.octokit.rest.activity.listPublicEventsForUser({
      username,
      per_page: 100,
    });
    return response.data.map((event) => ({
      type: event.type ?? 'UnknownEvent',
      createdAt: event.created_at ?? '',
      repositoryOwner: event.repo.name.split('/')[0] ?? '',
    }));
  }

  private translateError(error: unknown): never {
    if (error instanceof NotFoundError) throw error;
    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? Number((error as { status: unknown }).status)
        : undefined;
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (status === 404 || message.includes('could not resolve to a user'))
      throw new NotFoundError();
    if (status === 403 || status === 429 || message.includes('rate limit')) {
      throw new GitHubRateLimitError();
    }
    throw new GitHubApiError();
  }
}
