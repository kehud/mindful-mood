export interface ConfigOptionsState<T> {
  options: readonly T[];
  loading: boolean;
}

export interface ConfigTranslations {
  [languageCode: string]: string | undefined;
}

export interface MoodOption {
  value: number;
  label: string;
  translations?: ConfigTranslations;
  icon: string;
  color: string;
  order: number;
}

export interface EmotionOption {
  label: string;
  translations?: ConfigTranslations;
  category?: string;
  moodRange?: number[];
  order: number;
}

export interface InfluenceOption {
  label: string;
  translations?: ConfigTranslations;
  order: number;
}
