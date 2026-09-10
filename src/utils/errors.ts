export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly operational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'GitHub user not found') {
    super(message, 'USER_NOT_FOUND', 404);
  }
}

export class GitHubRateLimitError extends AppError {
  constructor() {
    super('GitHub API rate limit exceeded. Please try again later.', 'GITHUB_RATE_LIMITED', 503);
  }
}

export class GitHubApiError extends AppError {
  constructor() {
    super('Unable to retrieve GitHub data', 'GITHUB_API_ERROR', 502);
  }
}
