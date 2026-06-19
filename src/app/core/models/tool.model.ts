export interface ToolLocalizedText {
  en: string;
  he: string;
}

export interface ToolRecommendationTags {
  emotions: string[];
  influences: string[];
  moods: number[];
  activities: string[];
}

export interface ToolDefinition {
  id: string;
  enabled: boolean;
  category: 'therapeutic' | 'personal' | 'growth';
  template: 'therapeutic_session' | 'personal_activity' | 'growth_action';
  sessionMode?: 'timer' | 'guided_steps' | 'timer_guided_steps';
  iconKey: string;
  durationSeconds?: number;
  enableHaptics?: boolean;
  title: ToolLocalizedText;
  description: ToolLocalizedText;
  microPrompt?: ToolLocalizedText;
  completionText?: ToolLocalizedText;
  steps?: ToolLocalizedText[];
  recommendationTags: ToolRecommendationTags;
  order?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type ToolCategory = ToolDefinition['category'];
export type ToolTemplate = ToolDefinition['template'];
export type ToolSessionMode = NonNullable<ToolDefinition['sessionMode']>;
