export interface ConfigOptionsState<T> {
  options: readonly T[];
  loading: boolean;
}

export interface MoodOption {
  value: number;
  label: string;
  icon: string;
  color: string;
  order: number;
}

export interface EmotionOption {
  label: string;
  category?: string;
  moodRange?: number[];
  order: number;
}

export interface InfluenceOption {
  label: string;
  order: number;
}
