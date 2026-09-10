import type { GitHubRawData } from './github';

export interface DeveloperAnalytics {
  profile: GitHubRawData['profile'];
  activity: {
    totalContributions: number;
    currentStreak: number;
    longestStreak: number;
    lastContributionDate: string;
    mostActiveDay: string;
    mostActiveTime: string;
  };
  repositories: {
    totalRepositories: number;
    totalStars: number;
    totalForks: number;
    mostStarredRepository: { name: string; stars: number };
  };
  languages: Array<{ name: string; percentage: number }>;
  developerScore: { score: number; level: string };
  personality: { type: string; description: string };
  achievements: string[];
}

export interface AnalyticsSignals {
  totalContributions: number;
  activeDays: number;
  repositories: number;
  stars: number;
  languages: number;
  openSourceEvents: number;
  nightEventRatio: number;
}
