import type { AnalyticsSignals } from '../types/analytics';

export function calculateAchievements(signals: AnalyticsSignals): string[] {
  const achievements: string[] = [];
  if (signals.repositories >= 1) achievements.push('First Repository');
  if (signals.totalContributions >= 100) achievements.push('100 Contributions');
  if (signals.totalContributions >= 500) achievements.push('500 Contributions');
  if (signals.totalContributions >= 1000) achievements.push('1000 Contributions');
  if (signals.repositories >= 10) achievements.push('10+ Repositories');
  if (signals.stars >= 50) achievements.push('50+ Stars');
  if (signals.languages >= 5) achievements.push('Polyglot Developer');
  if (signals.openSourceEvents >= 1) achievements.push('Open Source Contributor');
  return achievements;
}
