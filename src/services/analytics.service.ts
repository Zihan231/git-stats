import { calculateAchievements } from '../analytics/achievements';
import { determinePersonality } from '../analytics/personality';
import { calculateDeveloperScore } from '../analytics/score';
import { calculateStreaks } from '../analytics/streak';
import type { AnalyticsSignals, DeveloperAnalytics } from '../types/analytics';
import type { GitHubDataSource } from './github.service';
import type { GitHubRawData } from '../types/github';
import { MemoryCache } from '../utils/cache';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export class AnalyticsService {
  private readonly cache: MemoryCache<DeveloperAnalytics>;

  constructor(
    private readonly github: GitHubDataSource,
    cacheTtlMilliseconds = 3 * 60 * 60 * 1000,
  ) {
    this.cache = new MemoryCache(cacheTtlMilliseconds);
  }

  async getProfile(username: string): Promise<DeveloperAnalytics> {
    const cacheKey = username.toLowerCase();
    return this.cache.getOrSet(cacheKey, async () =>
      this.analyze(await this.github.getDeveloperData(username)),
    );
  }

  private analyze(data: GitHubRawData): DeveloperAnalytics {
    const streaks = calculateStreaks(data.contributionDays);
    const repositories = data.repositories;
    const totalStars = repositories.reduce((sum, repository) => sum + repository.stars, 0);
    const totalForks = repositories.reduce((sum, repository) => sum + repository.forks, 0);
    const mostStarred = repositories.reduce(
      (best, repository) => (repository.stars > best.stars ? repository : best),
      { name: '', stars: 0 },
    );
    const languages = this.calculateLanguages(data);
    const externalEvents = data.events.filter(
      (event) => event.repositoryOwner.toLowerCase() !== data.profile.username.toLowerCase(),
    );
    const nightEvents = data.events.filter((event) => {
      const hour = new Date(event.createdAt).getUTCHours();
      return hour >= 22 || hour < 6;
    }).length;
    const signals: AnalyticsSignals = {
      totalContributions: data.totalContributions,
      activeDays: data.contributionDays.filter((day) => day.contributionCount > 0).length,
      repositories: data.totalRepositories,
      stars: totalStars,
      languages: languages.length,
      openSourceEvents: externalEvents.length,
      nightEventRatio: data.events.length === 0 ? 0 : nightEvents / data.events.length,
    };

    return {
      profile: data.profile,
      activity: {
        totalContributions: data.totalContributions,
        ...streaks,
        mostActiveDay: this.mostActiveDay(data),
        mostActiveTime: this.mostActiveTime(data),
      },
      repositories: {
        totalRepositories: data.totalRepositories,
        totalStars,
        totalForks,
        mostStarredRepository: { name: mostStarred.name, stars: mostStarred.stars },
      },
      languages,
      developerScore: calculateDeveloperScore(signals),
      personality: determinePersonality(signals),
      achievements: calculateAchievements(signals),
    };
  }

  private calculateLanguages(data: GitHubRawData): Array<{ name: string; percentage: number }> {
    const totals = new Map<string, number>();
    for (const repository of data.repositories) {
      if (repository.isFork) continue;
      for (const language of repository.languages) {
        totals.set(language.name, (totals.get(language.name) ?? 0) + language.bytes);
      }
    }
    const totalBytes = [...totals.values()].reduce((sum, bytes) => sum + bytes, 0);
    if (totalBytes === 0) return [];

    return [...totals.entries()]
      .map(([name, bytes]) => ({
        name,
        percentage: Number(((bytes / totalBytes) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }

  private mostActiveDay(data: GitHubRawData): string {
    const totals = Array.from({ length: 7 }, () => 0);
    for (const day of data.contributionDays)
      totals[day.weekday] = (totals[day.weekday] ?? 0) + day.contributionCount;
    const maximum = Math.max(...totals);
    if (maximum === 0) return '';
    return WEEKDAYS[totals.indexOf(maximum)] ?? '';
  }

  private mostActiveTime(data: GitHubRawData): string {
    if (data.events.length === 0) return '';
    const buckets = [0, 0, 0, 0];
    for (const event of data.events) {
      const hour = new Date(event.createdAt).getUTCHours();
      const index = hour < 6 ? 0 : hour < 12 ? 1 : hour < 18 ? 2 : 3;
      buckets[index] = (buckets[index] ?? 0) + 1;
    }
    const labels = ['Night (UTC)', 'Morning (UTC)', 'Afternoon (UTC)', 'Evening (UTC)'];
    return labels[buckets.indexOf(Math.max(...buckets))] ?? '';
  }
}
