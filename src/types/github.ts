export interface ContributionDay {
  date: string;
  contributionCount: number;
  weekday: number;
}

export interface GitHubRepository {
  name: string;
  owner: string;
  stars: number;
  forks: number;
  isFork: boolean;
  languages: Array<{ name: string; bytes: number }>;
}

export interface GitHubEvent {
  type: string;
  createdAt: string;
  repositoryOwner: string;
}

export interface GitHubRawData {
  profile: {
    username: string;
    name: string;
    avatar: string;
    bio: string;
    followers: number;
    following: number;
  };
  contributionDays: ContributionDay[];
  totalContributions: number;
  repositories: GitHubRepository[];
  totalRepositories: number;
  events: GitHubEvent[];
}
