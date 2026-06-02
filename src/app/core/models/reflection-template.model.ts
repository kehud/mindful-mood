import { Timestamp } from 'firebase/firestore';

export type ReflectionTemplateLanguage = 'en' | 'he';

export interface ReflectionTemplateTranslation {
  title: string;
  body: string;
}

export type ReflectionTemplateTranslations = Record<
  ReflectionTemplateLanguage,
  ReflectionTemplateTranslation
>;

export interface ReflectionTemplate {
  id?: string;
  label: string;
  type: string;
  translations: ReflectionTemplateTranslations;
  minCheckins: number;
  order: number;
  isActive: boolean;
  updatedAt: Timestamp;
}

export interface DailyReflectionText {
  title: string;
  body: string;
}
