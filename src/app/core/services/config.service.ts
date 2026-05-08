import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, orderBy, query } from '@angular/fire/firestore';
import { Observable, catchError, map, of, shareReplay, startWith } from 'rxjs';

import {
  ConfigOptionsState,
  EmotionOption,
  InfluenceOption,
  MoodOption,
} from '../models/config-option.model';

const DEFAULT_MOOD_OPTIONS: readonly MoodOption[] = [
  { value: 1, label: 'Very unpleasant', icon: 'rainy-outline', color: '#6b7280', order: 1 },
  { value: 2, label: 'Unpleasant', icon: 'cloud-outline', color: '#78909c', order: 2 },
  { value: 3, label: 'Slightly unpleasant', icon: 'partly-sunny-outline', color: '#7aa7a1', order: 3 },
  { value: 4, label: 'Neutral', icon: 'ellipse-outline', color: '#4d8d7c', order: 4 },
  { value: 5, label: 'Slightly pleasant', icon: 'leaf-outline', color: '#5fa977', order: 5 },
  { value: 6, label: 'Pleasant', icon: 'sunny-outline', color: '#e2a447', order: 6 },
  { value: 7, label: 'Very pleasant', icon: 'heart-outline', color: '#d9737f', order: 7 },
];

const DEFAULT_EMOTION_OPTIONS: readonly EmotionOption[] = [
  { label: 'Calm', category: 'pleasant', order: 1 },
  { label: 'Happy', category: 'pleasant', order: 2 },
  { label: 'Grateful', category: 'pleasant', order: 3 },
  { label: 'Focused', category: 'pleasant', order: 4 },
  { label: 'Excited', category: 'pleasant', order: 5 },
  { label: 'Proud', category: 'pleasant', order: 6 },
  { label: 'Sad', category: 'unpleasant', order: 7 },
  { label: 'Anxious', category: 'unpleasant', order: 8 },
  { label: 'Angry', category: 'unpleasant', order: 9 },
  { label: 'Tired', category: 'unpleasant', order: 10 },
  { label: 'Lonely', category: 'unpleasant', order: 11 },
  { label: 'Overwhelmed', category: 'unpleasant', order: 12 },
  { label: 'Hopeful', category: 'pleasant', order: 13 },
  { label: 'Relaxed', category: 'pleasant', order: 14 },
  { label: 'Stressed', category: 'unpleasant', order: 15 },
  { label: 'Frustrated', category: 'unpleasant', order: 16 },
];

const DEFAULT_INFLUENCE_OPTIONS: readonly InfluenceOption[] = [
  { label: 'Family', order: 1 },
  { label: 'Partner', order: 2 },
  { label: 'Friends', order: 3 },
  { label: 'Work', order: 4 },
  { label: 'School', order: 5 },
  { label: 'Health', order: 6 },
  { label: 'Fitness', order: 7 },
  { label: 'Sleep', order: 8 },
  { label: 'Food', order: 9 },
  { label: 'Weather', order: 10 },
  { label: 'Money', order: 11 },
  { label: 'News', order: 12 },
  { label: 'Social media', order: 13 },
  { label: 'Hobbies', order: 14 },
  { label: 'Travel', order: 15 },
  { label: 'Other', order: 16 },
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
    const icon = readString(data, 'icon');
    const color = readString(data, 'color');
    const order = readNumber(data, 'order');

    if (value === null || label === null || icon === null || color === null || order === null) {
      return null;
    }

    return { value, label, icon, color, order };
  }

  private toEmotionOption(data: unknown): EmotionOption | null {
    if (!isRecord(data)) {
      return null;
    }

    const label = readString(data, 'label');
    const order = readNumber(data, 'order');

    if (label === null || order === null) {
      return null;
    }

    const category = readString(data, 'category');
    return category ? { label, category, order } : { label, order };
  }

  private toInfluenceOption(data: unknown): InfluenceOption | null {
    if (!isRecord(data)) {
      return null;
    }

    const label = readString(data, 'label');
    const order = readNumber(data, 'order');

    return label === null || order === null ? null : { label, order };
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
