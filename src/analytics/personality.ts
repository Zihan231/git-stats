import type { AnalyticsSignals } from '../types/analytics.js';

export function determinePersonality(signals: AnalyticsSignals): {
  type: string;
  description: string;
} {
  if (signals.nightEventRatio >= 0.5 && signals.totalContributions >= 25) {
    return {
      type: 'Night Owl Developer 🌙',
      description: 'Most visible GitHub activity happens during late-night hours.',
    };
  }
  if (signals.openSourceEvents >= 10) {
    return {
      type: 'Open Source Explorer 🌎',
      description: 'Frequently contributes to projects outside their own repositories.',
    };
  }
  if (signals.languages >= 4 && signals.repositories >= 5) {
    return {
      type: 'Full Stack Builder 🚀',
      description: 'Builds across a broad mix of languages and project types.',
    };
  }
  if (signals.activeDays >= 120) {
    return {
      type: 'Consistency Machine 🔥',
      description: 'Maintains a notably steady contribution rhythm throughout the year.',
    };
  }
  return {
    type: 'Project Creator 🛠️',
    description: 'Turns ideas into public repositories and steadily expands their craft.',
  };
}
