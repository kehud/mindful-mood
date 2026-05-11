import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, orderBy, query } from '@angular/fire/firestore';
import { Observable, catchError, map, of, shareReplay, startWith } from 'rxjs';

import {
  ConfigOptionsState,
  ConfigTranslations,
  EmotionOption,
  InfluenceOption,
  MoodOption,
} from '../models/config-option.model';

export const DEFAULT_MOOD_OPTIONS: readonly MoodOption[] = [
  { value: 1, label: 'Very unpleasant', translations: { en: 'Very unpleasant', he: 'מאוד לא נעים' }, icon: 'rainy-outline', color: '#B8A6FF', order: 1 },
  { value: 2, label: 'Unpleasant', translations: { en: 'Unpleasant', he: 'לא נעים' }, icon: 'cloud-outline', color: '#B8A6FF', order: 2 },
  { value: 3, label: 'Slightly unpleasant', translations: { en: 'Slightly unpleasant', he: 'קצת לא נעים' }, icon: 'partly-sunny-outline', color: '#8EDFD3', order: 3 },
  { value: 4, label: 'Neutral', translations: { en: 'Neutral', he: 'ניטרלי' }, icon: 'ellipse-outline', color: '#B8A6FF', order: 4 },
  { value: 5, label: 'Slightly pleasant', translations: { en: 'Slightly pleasant', he: 'קצת נעים' }, icon: 'leaf-outline', color: '#8EDFD3', order: 5 },
  { value: 6, label: 'Pleasant', translations: { en: 'Pleasant', he: 'נעים' }, icon: 'sunny-outline', color: '#F4C7D9', order: 6 },
  { value: 7, label: 'Very pleasant', translations: { en: 'Very pleasant', he: 'מאוד נעים' }, icon: 'heart-outline', color: '#F4C7D9', order: 7 },
];

export const DEFAULT_EMOTION_OPTIONS: readonly EmotionOption[] = [
  { label: 'Calm', translations: { en: 'Calm', he: 'רגוע' }, category: 'pleasant', moodRange: [4, 5, 6], order: 1 },
  { label: 'Happy', translations: { en: 'Happy', he: 'שמח' }, category: 'pleasant', moodRange: [5, 6, 7], order: 2 },
  { label: 'Grateful', translations: { en: 'Grateful', he: 'מכיר תודה' }, category: 'pleasant', moodRange: [5, 6, 7], order: 3 },
  { label: 'Focused', translations: { en: 'Focused', he: 'ממוקד' }, category: 'pleasant', moodRange: [4, 5, 6], order: 4 },
  { label: 'Excited', translations: { en: 'Excited', he: 'נרגש' }, category: 'pleasant', moodRange: [5, 6, 7], order: 5 },
  { label: 'Proud', translations: { en: 'Proud', he: 'גאה' }, category: 'pleasant', moodRange: [5, 6, 7], order: 6 },
  { label: 'Sad', translations: { en: 'Sad', he: 'עצוב' }, category: 'unpleasant', moodRange: [1, 2, 3], order: 7 },
  { label: 'Anxious', translations: { en: 'Anxious', he: 'חרד' }, category: 'unpleasant', moodRange: [1, 2, 3, 4], order: 8 },
  { label: 'Angry', translations: { en: 'Angry', he: 'כועס' }, category: 'unpleasant', moodRange: [1, 2, 3], order: 9 },
  { label: 'Tired', translations: { en: 'Tired', he: 'עייף' }, category: 'unpleasant', moodRange: [1, 2, 3, 4], order: 10 },
  { label: 'Lonely', translations: { en: 'Lonely', he: 'בודד' }, category: 'unpleasant', moodRange: [1, 2, 3], order: 11 },
  { label: 'Overwhelmed', translations: { en: 'Overwhelmed', he: 'מוצף' }, category: 'unpleasant', moodRange: [1, 2, 3], order: 12 },
  { label: 'Hopeful', translations: { en: 'Hopeful', he: 'מלא תקווה' }, category: 'pleasant', moodRange: [4, 5, 6], order: 13 },
  { label: 'Relaxed', translations: { en: 'Relaxed', he: 'נינוח' }, category: 'pleasant', moodRange: [4, 5, 6], order: 14 },
  { label: 'Stressed', translations: { en: 'Stressed', he: 'לחוץ' }, category: 'unpleasant', moodRange: [1, 2, 3, 4], order: 15 },
  { label: 'Frustrated', translations: { en: 'Frustrated', he: 'מתוסכל' }, category: 'unpleasant', moodRange: [1, 2, 3], order: 16 },
];

export const DEFAULT_INFLUENCE_OPTIONS: readonly InfluenceOption[] = [
  { label: 'Family', translations: { en: 'Family', he: 'משפחה' }, order: 1 },
  { label: 'Partner', translations: { en: 'Partner', he: 'בן/בת זוג' }, order: 2 },
  { label: 'Friends', translations: { en: 'Friends', he: 'חברים' }, order: 3 },
  { label: 'Work', translations: { en: 'Work', he: 'עבודה' }, order: 4 },
  { label: 'School', translations: { en: 'School', he: 'לימודים' }, order: 5 },
  { label: 'Health', translations: { en: 'Health', he: 'בריאות' }, order: 6 },
  { label: 'Fitness', translations: { en: 'Fitness', he: 'כושר' }, order: 7 },
  { label: 'Sleep', translations: { en: 'Sleep', he: 'שינה' }, order: 8 },
  { label: 'Food', translations: { en: 'Food', he: 'אוכל' }, order: 9 },
  { label: 'Weather', translations: { en: 'Weather', he: 'מזג אוויר' }, order: 10 },
  { label: 'Money', translations: { en: 'Money', he: 'כסף' }, order: 11 },
  { label: 'News', translations: { en: 'News', he: 'חדשות' }, order: 12 },
  { label: 'Social media', translations: { en: 'Social media', he: 'רשתות חברתיות' }, order: 13 },
  { label: 'Hobbies', translations: { en: 'Hobbies', he: 'תחביבים' }, order: 14 },
  { label: 'Travel', translations: { en: 'Travel', he: 'נסיעות' }, order: 15 },
  { label: 'Other', translations: { en: 'Other', he: 'אחר' }, order: 16 },
];

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private readonly firestore = inject(Firestore);

  readonly moodOptionsState$ = this.loadOptions(
    'moodOptions',
    DEFAULT_MOOD_OPTIONS,
    this.toMoodOption,
  );
  readonly emotionOptionsState$ = this.loadOptions(
    'emotionOptions',
    DEFAULT_EMOTION_OPTIONS,
    this.toEmotionOption,
  );
  readonly influenceOptionsState$ = this.loadOptions(
    'influenceOptions',
    DEFAULT_INFLUENCE_OPTIONS,
    this.toInfluenceOption,
  );

  private loadOptions<T extends { order: number }>(
    collectionName: string,
    fallbackOptions: readonly T[],
    toOption: (data: unknown) => T | null,
  ): Observable<ConfigOptionsState<T>> {
    const configRef = collection(this.firestore, collectionName);
    const configQuery = query(configRef, orderBy('order', 'asc'));
    const fallbackState = this.toState(fallbackOptions, true);

    return collectionData(configQuery).pipe(
      map((items) => items.map(toOption).filter((option): option is T => option !== null)),
      map((options) => (options.length ? this.sortOptions(options) : [...fallbackOptions])),
      map((options) => this.toState(options, false)),
      catchError(() => of(this.toState(fallbackOptions, false))),
      startWith(fallbackState),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  private toMoodOption(data: unknown): MoodOption | null {
    if (!isRecord(data)) {
      return null;
    }

    const value = readNumber(data, 'value');
    const label = readString(data, 'label');
    const translations = readTranslations(data, 'translations');
    const icon = readString(data, 'icon');
    const color = readString(data, 'color');
    const order = readNumber(data, 'order');

    if (value === null || label === null || translations === null || icon === null || color === null || order === null) {
      return null;
    }

    return { value, label, ...(translations ? { translations } : {}), icon, color, order };
  }

  private toEmotionOption(data: unknown): EmotionOption | null {
    if (!isRecord(data)) {
      return null;
    }

    const label = readString(data, 'label');
    const translations = readTranslations(data, 'translations');
    const order = readNumber(data, 'order');

    if (label === null || translations === null || order === null) {
      return null;
    }

    const category = readString(data, 'category');
    const moodRange = readOptionalNumberArray(data, 'moodRange');

    if (moodRange === null) {
      return null;
    }

    return {
      label,
      ...(translations ? { translations } : {}),
      ...(category ? { category } : {}),
      ...(moodRange ? { moodRange } : {}),
      order,
    };
  }

  private toInfluenceOption(data: unknown): InfluenceOption | null {
    if (!isRecord(data)) {
      return null;
    }

    const label = readString(data, 'label');
    const translations = readTranslations(data, 'translations');
    const order = readNumber(data, 'order');

    return label === null || translations === null || order === null
      ? null
      : { label, ...(translations ? { translations } : {}), order };
  }

  private sortOptions<T extends { order: number }>(options: readonly T[]): T[] {
    return [...options].sort((a, b) => a.order - b.order);
  }

  private toState<T>(options: readonly T[], loading: boolean): ConfigOptionsState<T> {
    return {
      options: [...options],
      loading,
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];

  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readNumber(data: Record<string, unknown>, key: string): number | null {
  const value = data[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readOptionalNumberArray(data: Record<string, unknown>, key: string): number[] | null | undefined {
  const value = data[key];

  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || !value.every((item) => typeof item === 'number' && Number.isFinite(item))) {
    return null;
  }

  return value;
}

function readTranslations(data: Record<string, unknown>, key: string): ConfigTranslations | null | undefined {
  const value = data[key];

  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    return null;
  }

  const translations = Object.entries(value).reduce<ConfigTranslations>((accumulator, [language, translation]) => {
    if (typeof translation === 'string' && translation.trim()) {
      accumulator[language] = translation.trim();
    }

    return accumulator;
  }, {});

  return Object.keys(translations).length ? translations : undefined;
}
