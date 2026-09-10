import { calculateStreaks } from '../src/analytics/streak';

describe('calculateStreaks', () => {
  it('calculates longest and current streak ending today', () => {
    const result = calculateStreaks(
      [
        { date: '2026-01-01', contributionCount: 1, weekday: 4 },
        { date: '2026-01-02', contributionCount: 2, weekday: 5 },
        { date: '2026-01-05', contributionCount: 1, weekday: 1 },
        { date: '2026-01-06', contributionCount: 3, weekday: 2 },
        { date: '2026-01-07', contributionCount: 1, weekday: 3 },
      ],
      new Date('2026-01-07T12:00:00Z'),
    );
    expect(result).toEqual({
      currentStreak: 3,
      longestStreak: 3,
      lastContributionDate: '2026-01-07',
    });
  });

  it('keeps yesterday-ending streak current while today is in progress', () => {
    const result = calculateStreaks(
      [
        { date: '2026-01-05', contributionCount: 2, weekday: 1 },
        { date: '2026-01-06', contributionCount: 1, weekday: 2 },
        { date: '2026-01-07', contributionCount: 0, weekday: 3 },
      ],
      new Date('2026-01-07T01:00:00Z'),
    );
    expect(result.currentStreak).toBe(2);
  });

  it('returns zeros for an empty calendar', () => {
    expect(calculateStreaks([])).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      lastContributionDate: '',
    });
  });
});
