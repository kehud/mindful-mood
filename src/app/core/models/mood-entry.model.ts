export type MoodLevel = number;

export interface MoodEntry {
  id: string;
  userId: string;
  moodLevel: MoodLevel;
  emotions: string[];
  influences: string[];
  journalNote: string;
  createdAt: string;
}

export interface CheckInDraft {
  moodLevel: MoodLevel;
  emotions: string[];
  influences: string[];
  journalNote: string;
}

export interface MoodDistributionItem {
  level: MoodLevel;
  count: number;
  percent: number;
}

export interface InsightFrequencyItem {
  label: string;
  count: number;
}

export interface WeeklyMoodTrendItem {
  label: string;
  dateIso: string;
  averageMood: number;
  count: number;
  percent: number;
}

export interface InsightSummary {
  averageMood: number;
  checkInCount: number;
  checkInsThisWeek: number;
  topEmotions: string[];
  topInfluences: string[];
  topEmotionItems: InsightFrequencyItem[];
  topInfluenceItems: InsightFrequencyItem[];
  distribution: MoodDistributionItem[];
  weeklyTrend: WeeklyMoodTrendItem[];
}
