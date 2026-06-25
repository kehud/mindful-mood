import { MoodLevel } from './mood-entry.model';

export type RecommendationCategory = 'therapeutic' | 'personal' | 'growth';
export type RecommendationMode = 'support' | 'growth';

export interface RecommendationLocalizedText {
  readonly en: string;
  readonly he?: string;
}

export interface UserPreferences {
  readonly id?: string;
  readonly userId?: string;
  readonly preferredToolIds?: readonly string[];
  readonly preferredCategories?: readonly RecommendationCategory[];
  readonly preferredEmotions?: readonly string[];
  readonly preferredInfluences?: readonly string[];
  readonly preferredActivities?: readonly string[];
  readonly avoidedToolIds?: readonly string[];
  readonly updatedAt?: string;
}

export interface RecommendationTool {
  readonly id: string;
  readonly type?: string;
  readonly momentCategory?: string;
  readonly title: string;
  readonly icon: string;
  readonly category: RecommendationCategory;
  readonly description: string;
  readonly titleTranslations?: RecommendationLocalizedText;
  readonly descriptionTranslations?: RecommendationLocalizedText;
  readonly matchingEmotions: readonly string[];
  readonly matchingInfluences: readonly string[];
  readonly matchingPreferences: readonly string[];
  readonly supportedMoodRange: readonly [MoodLevel, MoodLevel];
  readonly supportedModes: readonly RecommendationMode[];
}

export interface ToolEngagement {
  readonly id?: string;
  readonly userId: string;
  readonly toolId: string;
  readonly shownCount: number;
  readonly openedCount: number;
  readonly lastShownAt?: string;
  readonly lastOpenedAt?: string;
  readonly updatedAt: string;
}

export interface RecommendationScoreBreakdown {
  readonly emotionMatch: number;
  readonly influenceMatch: number;
  readonly preferenceMatch: number;
  readonly moodMatch: number;
  readonly engagementScore: number;
}

export interface RecommendationResult {
  readonly tool: RecommendationTool;
  readonly mode: RecommendationMode;
  readonly score: number;
  readonly scoreBreakdown: RecommendationScoreBreakdown;
}

export type ToolEngagementMap = Readonly<Record<string, ToolEngagement | undefined>>;
