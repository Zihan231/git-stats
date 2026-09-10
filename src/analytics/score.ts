import type { AnalyticsSignals } from '../types/analytics.js';

function ratio(value: number, target: number): number {
  return Math.min(Math.max(value / target, 0), 1);
}

export function calculateDeveloperScore(signals: AnalyticsSignals): {
  score: number;
  level: string;
} {
  // Targets represent strong activity over the rolling one-year analysis window.
  const score = Math.round(
    ratio(signals.activeDays, 180) * 30 +
      ratio(signals.repositories, 20) * 20 +
      ratio(signals.stars, 100) * 20 +
      ratio(signals.languages, 5) * 15 +
      ratio(signals.openSourceEvents, 20) * 15,
  );

  const level =
    score <= 20
      ? 'Beginner'
      : score <= 50
        ? 'Growing Developer'
        : score <= 80
          ? 'Active Builder'
          : 'Advanced Builder';

  return { score, level };
}
