import type { ContributionDay } from '../types/github';

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  lastContributionDate: string;
}

function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function calculateStreaks(
  contributionDays: ContributionDay[],
  today = new Date(),
): StreakResult {
  const activeDates = [
    ...new Set(contributionDays.filter((d) => d.contributionCount > 0).map((d) => d.date)),
  ].sort();

  if (activeDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastContributionDate: '' };
  }

  let longestStreak = 1;
  let runningStreak = 1;
  for (let index = 1; index < activeDates.length; index += 1) {
    const previous = new Date(`${activeDates[index - 1]}T00:00:00Z`);
    const current = new Date(`${activeDates[index]}T00:00:00Z`);
    const dayDifference = (current.getTime() - previous.getTime()) / 86_400_000;
    runningStreak = dayDifference === 1 ? runningStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, runningStreak);
  }

  const activeSet = new Set(activeDates);
  const cursor = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  // A streak remains current until the end of the following day, so a developer is not
  // penalized while the present UTC day is still in progress.
  if (!activeSet.has(utcDateKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);

  let currentStreak = 0;
  while (activeSet.has(utcDateKey(cursor))) {
    currentStreak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return {
    currentStreak,
    longestStreak,
    lastContributionDate: activeDates.at(-1) ?? '',
  };
}
