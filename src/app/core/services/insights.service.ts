import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';

import {
  InsightFrequencyItem,
  InsightSummary,
  MoodDistributionItem,
  MoodEntry,
  MoodLevel,
  WeeklyMoodTrendItem,
} from '../models/mood-entry.model';
import { MoodEntryService } from './mood-entry.service';

@Injectable({
  providedIn: 'root',
})
export class InsightsService {
  private readonly moodEntryService = inject(MoodEntryService);

  readonly summary$ = this.moodEntryService.entries$.pipe(
    map((entries) => {
      const checkInCount = entries.length;
      const averageMood = checkInCount
        ? Number((entries.reduce((total, entry) => total + entry.moodLevel, 0) / checkInCount).toFixed(1))
        : 0;
      const topEmotionItems = this.topItems(entries.reduce<string[]>((items, entry) => [...items, ...entry.emotions], []));
      const topInfluenceItems = this.topItems(entries.reduce<string[]>((items, entry) => [...items, ...entry.influences], []));

      return {
        averageMood,
        checkInCount,
        checkInsThisWeek: this.countThisWeek(entries),
        topEmotions: topEmotionItems.map((item) => item.label),
        topInfluences: topInfluenceItems.map((item) => item.label),
        topEmotionItems,
        topInfluenceItems,
        distribution: this.distribution(entries.map((entry) => entry.moodLevel)),
        weeklyTrend: this.weeklyTrend(entries),
      } satisfies InsightSummary;
    }),
  );

  private topItems(items: string[]): InsightFrequencyItem[] {
    const counts = items.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item] = (accumulator[item] ?? 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([label, count]) => ({ label, count }));
  }

  private distribution(levels: MoodLevel[]): MoodDistributionItem[] {
    const maxCount = Math.max(1, ...levels.map((level) => levels.filter((item) => item === level).length));

    return ([1, 2, 3, 4, 5, 6, 7] as MoodLevel[]).map((level) => {
      const count = levels.filter((item) => item === level).length;

      return {
        level,
        count,
        percent: Math.round((count / maxCount) * 100),
      };
    });
  }

  private countThisWeek(entries: MoodEntry[]): number {
    const startOfWeek = this.startOfCurrentWeek();

    return entries.filter((entry) => new Date(entry.createdAt) >= startOfWeek).length;
  }

  private weeklyTrend(entries: MoodEntry[]): WeeklyMoodTrendItem[] {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - (6 - index));
      return date;
    });

    return days.map((date) => {
      const dayEntries = entries.filter((entry) => this.isSameDay(new Date(entry.createdAt), date));
      const averageMood = dayEntries.length
        ? Number((dayEntries.reduce((total, entry) => total + entry.moodLevel, 0) / dayEntries.length).toFixed(1))
        : 0;

      return {
        label: date.toLocaleDateString(undefined, { weekday: 'short' }),
        averageMood,
        count: dayEntries.length,
        percent: averageMood ? Math.round((averageMood / 7) * 100) : 0,
      };
    });
  }

  private startOfCurrentWeek(): Date {
    const date = new Date();
    const day = date.getDay();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - day);
    return date;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
}
