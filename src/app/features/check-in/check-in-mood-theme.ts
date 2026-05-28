const DEFAULT_MOOD_LEVEL = 4;
const MIN_MOOD_LEVEL = 1;
const MAX_MOOD_LEVEL = 7;

export function normalizeMoodLevel(level: number): number {
  if (!Number.isFinite(level)) {
    return DEFAULT_MOOD_LEVEL;
  }

  return Math.min(MAX_MOOD_LEVEL, Math.max(MIN_MOOD_LEVEL, Math.round(level)));
}

export function moodThemeClassForLevel(level: number): string {
  return `mood-theme--${normalizeMoodLevel(level)}`;
}

export function moodBloomClassForLevel(level: number): string {
  return `mood-bloom--level-${normalizeMoodLevel(level)}`;
}
