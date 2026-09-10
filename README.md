# GitHub Developer Analytics API

A TypeScript/Express service that turns public GitHub profile, contribution, repository, language, and event data into a stable analytics JSON response. It is designed as the backend for future README cards, portfolio dashboards, badges, and periodic developer reports.

## Features

- Authenticated GitHub GraphQL and REST access through Octokit
- Rolling one-year contribution analytics and custom streak calculation
- Repository, star, fork, and byte-weighted language summaries
- Transparent 0–100 developer score, personality, and achievements
- In-memory response cache with request coalescing (configurable 1–6 hour TTL)
- Helmet, configurable CORS, rate limiting, Zod validation, structured Pino logs, and safe errors
- Graceful shutdown, health check, Jest/Supertest tests, ESLint, and Prettier

Only public GitHub data is requested. The GitHub token is used server-side and is never included in a response or log.

## Setup

Requirements: Node.js 20+ and a fine-grained GitHub personal access token that can read public repositories.

```bash
npm install
cp .env.example .env
# Set GITHUB_TOKEN in .env
npm run dev
```

For production:

```bash
npm run build
npm start
```

### Deploying to Vercel

The repository includes a Vercel serverless entry point and catch-all rewrite. Import the
repository into Vercel, then add `GITHUB_TOKEN` under **Project Settings → Environment
Variables** for Production, Preview, and Development as needed. Redeploy after adding or
changing the token.

Optional variables such as `CORS_ORIGIN` and `CACHE_TTL_SECONDS` can be configured in the
same place. Do not upload the local `.env` file or expose its token in client-side variables.

After deployment, verify:

```text
https://your-project.vercel.app/health
https://your-project.vercel.app/api/github/profile/zihan231
```

## Environment variables

| Variable               | Required | Default  | Description                               |
| ---------------------- | -------- | -------- | ----------------------------------------- |
| `GITHUB_TOKEN`         | Yes      | —        | Fine-grained GitHub personal access token |
| `PORT`                 | No       | `5000`   | HTTP port                                 |
| `CORS_ORIGIN`          | No       | `*`      | Comma-separated allowed origins, or `*`   |
| `CACHE_TTL_SECONDS`    | No       | `10800`  | Cache duration from 3600 to 21600 seconds |
| `RATE_LIMIT_WINDOW_MS` | No       | `900000` | Client rate-limit window                  |
| `RATE_LIMIT_MAX`       | No       | `100`    | Requests allowed per window               |
| `LOG_LEVEL`            | No       | `info`   | Pino log level                            |

The server validates configuration before listening. `.env` and `.env.*` are ignored by Git; `.env.example` is intentionally tracked.

## API

### `GET /health`

Returns process readiness:

```json
{ "success": true, "data": { "status": "ok" } }
```

### `GET /api/github/profile/:username`

Example: `GET /api/github/profile/zihan231`

```json
{
  "success": true,
  "data": {
    "profile": {
      "username": "zihan231",
      "name": "",
      "avatar": "https://avatars.githubusercontent.com/...",
      "bio": "",
      "followers": 0,
      "following": 0
    },
    "activity": {
      "totalContributions": 123,
      "currentStreak": 4,
      "longestStreak": 12,
      "lastContributionDate": "2026-09-09",
      "mostActiveDay": "Wednesday",
      "mostActiveTime": "Evening (UTC)"
    },
    "repositories": {
      "totalRepositories": 10,
      "totalStars": 24,
      "totalForks": 5,
      "mostStarredRepository": { "name": "example", "stars": 20 }
    },
    "languages": [{ "name": "TypeScript", "percentage": 64.2 }],
    "developerScore": { "score": 48, "level": "Growing Developer" },
    "personality": {
      "type": "Project Creator 🛠️",
      "description": "Turns ideas into public repositories and steadily expands their craft."
    },
    "achievements": ["First Repository", "100 Contributions"]
  }
}
```

Time-of-day analytics use up to the 100 most recent public events and report UTC buckets. GitHub exposes a rolling public-events window, so this is a recent-activity signal rather than an all-time measure. Language percentages use repository byte counts and exclude forked repositories.

All failures have one shape:

```json
{
  "success": false,
  "error": { "message": "Invalid GitHub username", "code": "INVALID_USERNAME" }
}
```

Codes include `INVALID_USERNAME`, `USER_NOT_FOUND`, `GITHUB_RATE_LIMITED`, `GITHUB_API_ERROR`, `RATE_LIMITED`, `ROUTE_NOT_FOUND`, and `INTERNAL_ERROR`.

## Scoring model

The score is capped at 100 and uses explicit rolling-year targets:

| Signal                      | Weight |                       Full-credit target |
| --------------------------- | -----: | ---------------------------------------: |
| Contribution consistency    |    30% |                          180 active days |
| Repository activity         |    20% |             20 owned public repositories |
| Stars received              |    20% |                                100 stars |
| Language breadth            |    15% |                              5 languages |
| Recent open-source activity |    15% | 20 public events in others' repositories |

Levels are Beginner (0–20), Growing Developer (21–50), Active Builder (51–80), and Advanced Builder (81–100).

## Architecture

The route validates input and delegates to a controller. The controller calls `AnalyticsService`, which owns caching and composes independent analytics modules. `GitHubService` is the only GitHub integration boundary and paginates all owned public repositories. Dependency injection keeps live API access out of tests and allows a distributed cache or alternate data source later.

```text
GitHub GraphQL + REST -> GitHubService -> AnalyticsService -> Controller -> JSON
                                           | streak
                                           | score
                                           | personality
                                           + achievements
```

For horizontal scaling, replace `MemoryCache` with Redis while retaining the service interface. The analytics modules remain independent of Express and Octokit.

## Quality checks

```bash
npm test
npm run lint
npm run format:check
npm run build
```

## Roadmap

- Redis caching and cache observability
- SVG README card endpoint at `/api/github/card/:username`
- Portfolio aggregation at `/api/github/portfolio/:username`
- Monthly/yearly reports at `/api/github/report/:username`
- Persistent snapshots for historical growth and star deltas
