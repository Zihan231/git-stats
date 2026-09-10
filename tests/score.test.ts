import { calculateDeveloperScore } from '../src/analytics/score';

describe('calculateDeveloperScore', () => {
  it('caps a highly active developer at 100', () => {
    expect(
      calculateDeveloperScore({
        totalContributions: 2000,
        activeDays: 365,
        repositories: 100,
        stars: 10000,
        languages: 20,
        openSourceEvents: 100,
        nightEventRatio: 0,
      }),
    ).toEqual({ score: 100, level: 'Advanced Builder' });
  });

  it.each([
    [20, 'Beginner', { repositories: 20, stars: 0, languages: 0, openSourceEvents: 0 }],
    [21, 'Growing Developer', { repositories: 20, stars: 5, languages: 0, openSourceEvents: 0 }],
    [50, 'Growing Developer', { repositories: 20, stars: 0, languages: 0, openSourceEvents: 0 }],
    [51, 'Active Builder', { repositories: 20, stars: 5, languages: 0, openSourceEvents: 0 }],
    [80, 'Active Builder', { repositories: 20, stars: 100, languages: 3, openSourceEvents: 1 }],
    [81, 'Advanced Builder', { repositories: 20, stars: 100, languages: 3, openSourceEvents: 2 }],
  ])('maps score %i to %s', (expected, level, inputs) => {
    const result = calculateDeveloperScore({
      totalContributions: 0,
      activeDays: expected >= 50 ? 180 : 0,
      ...inputs,
      nightEventRatio: 0,
    });
    expect(result.score).toBe(expected);
    expect(result.level).toBe(level);
  });
});
