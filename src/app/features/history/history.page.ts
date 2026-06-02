import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { EmotionOption, InfluenceOption, MoodOption } from '../../core/models/config-option.model';
import { MoodEntry } from '../../core/models/mood-entry.model';
import { ConfigService } from '../../core/services/config.service';
import { LocalizationService } from '../../core/services/localization.service';
import { MoodEntryService } from '../../core/services/mood-entry.service';
import { ConfigLabelPipe } from '../../shared/pipes/config-label.pipe';
import { MoodLabelPipe } from '../../shared/pipes/mood-label.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

interface WeekDayItem {
  readonly iso: string;
  readonly weekday: string;
  readonly day: string;
  readonly count: number;
}

interface TrendPoint {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly level: number;
  readonly color: string;
}

interface FrequencyItem {
  readonly label: string;
  readonly count: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_TREND_POINTS = 6;
const SAVED_REFLECTIONS_PAGE_SIZE = 5;

const MOOD_COLORS_BY_LEVEL: Record<number, string> = {
  1: '#8b64c8',
  2: '#6f7ad9',
  3: '#619bdf',
  4: '#31bdc0',
  5: '#77aa7d',
  6: '#e29d42',
  7: '#ef7f69',
};

const NAMED_MOOD_COLORS: Record<string, string> = {
  blue: '#619bdf',
  green: '#77aa7d',
  indigo: '#6f7ad9',
  orange: '#e29d42',
  purple: '#8b64c8',
  teal: '#31bdc0',
  yellow: '#e6b84f',
};

const MOOD_ICONS_BY_LEVEL: Record<number, string> = {
  1: 'sad-outline',
  2: 'sad-outline',
  3: 'remove-circle-outline',
  4: 'ellipse-outline',
  5: 'happy-outline',
  6: 'happy-outline',
  7: 'heart-outline',
};

const EMOTION_ICONS: Record<string, string> = {
  Angry: 'flame-outline',
  Anxious: 'warning-outline',
  Calm: 'water-outline',
  Content: 'heart-outline',
  Excited: 'flash-outline',
  Focused: 'eye-outline',
  Frustrated: 'thunderstorm-outline',
  Grateful: 'heart-outline',
  Happy: 'sunny-outline',
  Hopeful: 'heart-circle-outline',
  Lonely: 'person-outline',
  Overwhelmed: 'layers-outline',
  Proud: 'ribbon-outline',
  Relaxed: 'leaf-outline',
  Sad: 'sad-outline',
  Stressed: 'snow-outline',
  Tired: 'moon-outline',
};

const INFLUENCE_ICONS: Record<string, string> = {
  Exercise: 'barbell-outline',
  Family: 'people-outline',
  Fitness: 'barbell-outline',
  Food: 'restaurant-outline',
  Friends: 'people-circle-outline',
  Health: 'heart-outline',
  Hobbies: 'color-palette-outline',
  Money: 'cash-outline',
  News: 'newspaper-outline',
  Other: 'ellipsis-horizontal-circle-outline',
  Partner: 'heart-circle-outline',
  Relationships: 'people-outline',
  School: 'school-outline',
  Sleep: 'moon-outline',
  'Social Media': 'chatbubbles-outline',
  'Social media': 'chatbubbles-outline',
  Travel: 'airplane-outline',
  Weather: 'partly-sunny-outline',
  Work: 'briefcase-outline',
};

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    AsyncPipe,
    ConfigLabelPipe,
    DatePipe,
    IonicModule,
    MoodLabelPipe,
    NgFor,
    NgIf,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
})
export class HistoryPage {
  private readonly configService = inject(ConfigService);
  protected readonly localization = inject(LocalizationService);
  private readonly moodEntryService = inject(MoodEntryService);

  readonly moodOptionsState$ = this.configService.moodOptionsState$;
  readonly emotionOptionsState$ = this.configService.emotionOptionsState$;
  readonly influenceOptionsState$ = this.configService.influenceOptionsState$;
  readonly currentLanguage = this.localization.currentLanguage;
  readonly entries$ = this.moodEntryService.entries$;
  readonly entriesLoading$ = this.moodEntryService.entriesLoading$;
  readonly entriesError$ = this.moodEntryService.entriesError$;
  savedReflectionsExpanded = false;
  visibleSavedReflectionsCount = SAVED_REFLECTIONS_PAGE_SIZE;

  private selectedDateIsoOverride = '';

  selectDate(iso: string): void {
    this.selectedDateIsoOverride = iso;
  }

  activeDateIso(entries: readonly MoodEntry[]): string {
    if (this.selectedDateIsoOverride) {
      return this.selectedDateIsoOverride;
    }

    const latestEntry = entries[0];

    return latestEntry ? this.isoDayFromDate(this.toDate(latestEntry.createdAt)) : this.isoDayFromDate(new Date());
  }

  weekDays(entries: readonly MoodEntry[]): WeekDayItem[] {
    const activeDate = this.dateFromIsoDay(this.activeDateIso(entries));
    const startDate = new Date(activeDate.getTime() - 3 * DAY_MS);
    const entryCounts = this.countEntriesByDay(entries);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startDate.getTime() + index * DAY_MS);
      const iso = this.isoDayFromDate(date);

      return {
        iso,
        weekday: new Intl.DateTimeFormat(this.currentLanguage(), { weekday: 'short' }).format(date),
        day: new Intl.DateTimeFormat(this.currentLanguage(), { day: 'numeric' }).format(date),
        count: entryCounts.get(iso) ?? 0,
      };
    });
  }

  selectedDayEntries(entries: readonly MoodEntry[]): MoodEntry[] {
    const activeIso = this.activeDateIso(entries);

    return entries
      .filter((entry) => this.isoDayFromDate(this.toDate(entry.createdAt)) === activeIso)
      .sort((a, b) => this.toDate(a.createdAt).getTime() - this.toDate(b.createdAt).getTime());
  }

  selectedDateLabel(entries: readonly MoodEntry[]): string {
    const date = this.dateFromIsoDay(this.activeDateIso(entries));

    return new Intl.DateTimeFormat(this.currentLanguage(), {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  checkInCountLabel(count: number): string {
    return this.localization.translate(
      count === 1 ? 'history.checkInsCountOne' : 'history.checkInsCountMany',
      { count },
    );
  }

  totalCountLabel(count: number): string {
    return this.localization.translate(
      count === 1 ? 'history.totalCountOne' : 'history.totalCountMany',
      { count },
    );
  }

  frequencyLabel(count: number): string {
    return this.localization.translate(
      count === 1 ? 'history.frequencyOne' : 'history.frequencyMany',
      { count },
    );
  }

  averageMood(entries: readonly MoodEntry[]): number {
    if (!entries.length) {
      return 0;
    }

    const total = entries.reduce((sum, entry) => sum + entry.moodLevel, 0);

    return total / entries.length;
  }

  moodStatusLabel(entries: readonly MoodEntry[], options: readonly MoodOption[]): string {
    if (!entries.length) {
      return this.localization.translate('history.noCheckInsShort');
    }

    return this.moodLabel(this.averageMood(entries), options);
  }

  moodTrendAriaLabel(entries: readonly MoodEntry[]): string {
    return this.localization.translate('history.moodTrendAria', {
      date: this.selectedDateLabel(entries),
    });
  }

  savedReflectionsToggleLabel(): string {
    return this.localization.translate(
      this.savedReflectionsExpanded ? 'history.hideSavedReflections' : 'history.showSavedReflections',
    );
  }

  toggleSavedReflections(): void {
    this.savedReflectionsExpanded = !this.savedReflectionsExpanded;

    if (!this.savedReflectionsExpanded) {
      this.visibleSavedReflectionsCount = SAVED_REFLECTIONS_PAGE_SIZE;
    }
  }

  visibleSavedEntries(entries: readonly MoodEntry[]): readonly MoodEntry[] {
    return entries.slice(0, this.visibleSavedReflectionsCount);
  }

  hasMoreSavedEntries(entries: readonly MoodEntry[]): boolean {
    return this.visibleSavedReflectionsCount < entries.length;
  }

  loadMoreSavedReflections(entries: readonly MoodEntry[]): void {
    this.visibleSavedReflectionsCount = Math.min(
      this.visibleSavedReflectionsCount + SAVED_REFLECTIONS_PAGE_SIZE,
      entries.length,
    );
  }

  moodLabel(level: number, options: readonly MoodOption[]): string {
    if (!Number.isFinite(level) || level < 1) {
      return this.localization.translate('mood.notSet');
    }

    const roundedLevel = Math.round(level);
    const option = options.find((item) => item.value === roundedLevel);

    return option ? this.localization.configLabel(option) : this.localization.translate(`mood.${roundedLevel}`);
  }

  moodColor(level: number, options: readonly MoodOption[]): string {
    const roundedLevel = this.normalizeMoodLevel(level);
    const optionColor = options.find((item) => item.value === roundedLevel)?.color;
    const normalizedColor = optionColor?.trim().toLowerCase();

    return normalizedColor
      ? NAMED_MOOD_COLORS[normalizedColor] ?? optionColor ?? MOOD_COLORS_BY_LEVEL[roundedLevel]
      : MOOD_COLORS_BY_LEVEL[roundedLevel];
  }

  moodIcon(level: number): string {
    return MOOD_ICONS_BY_LEVEL[this.normalizeMoodLevel(level)] ?? 'ellipse-outline';
  }

  timeLabel(value: string): string {
    return new Intl.DateTimeFormat(this.currentLanguage(), {
      hour: 'numeric',
      minute: '2-digit',
    }).format(this.toDate(value));
  }

  trendPoints(entries: readonly MoodEntry[], moodOptions: readonly MoodOption[]): TrendPoint[] {
    const visibleEntries = this.visibleTrendEntries(entries);
    const chartStartX = 24;
    const chartEndX = 262;
    const chartTopY = 22;
    const chartBottomY = 108;
    const spanX = chartEndX - chartStartX;
    const spanY = chartBottomY - chartTopY;

    return visibleEntries.map((entry, index) => {
      const x = visibleEntries.length === 1
        ? chartStartX + spanX / 2
        : chartStartX + (spanX / (visibleEntries.length - 1)) * index;
      const level = this.normalizeMoodLevel(entry.moodLevel);
      const y = chartBottomY - ((level - 1) / 6) * spanY;

      return {
        id: entry.id,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        label: this.timeLabel(entry.createdAt),
        level,
        color: this.moodColor(level, moodOptions),
      };
    });
  }

  trendPath(points: readonly TrendPoint[]): string {
    if (!points.length) {
      return '';
    }

    if (points.length === 1) {
      const point = points[0];

      return `M ${point.x - 18} ${point.y} L ${point.x + 18} ${point.y}`;
    }

    return points.slice(1).reduce((path, point, index) => {
      const previous = points[index];
      const midX = (previous.x + point.x) / 2;

      return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
    }, `M ${points[0].x} ${points[0].y}`);
  }

  topEmotionItems(entries: readonly MoodEntry[]): FrequencyItem[] {
    return this.topItems(this.collectEntryValues(entries, 'emotions'));
  }

  topInfluenceItems(entries: readonly MoodEntry[]): FrequencyItem[] {
    return this.topItems(this.collectEntryValues(entries, 'influences'));
  }

  emotionIcon(label: string, options: readonly EmotionOption[]): string {
    return EMOTION_ICONS[this.configLabel(label, options)] ?? EMOTION_ICONS[label] ?? 'sparkles-outline';
  }

  influenceIcon(label: string, options: readonly InfluenceOption[]): string {
    return INFLUENCE_ICONS[this.configLabel(label, options)] ?? INFLUENCE_ICONS[label] ?? 'ellipse-outline';
  }

  trackByWeekDay(_index: number, item: WeekDayItem): string {
    return item.iso;
  }

  trackByEntryId(_index: number, entry: MoodEntry): string {
    return entry.id;
  }

  trackByPoint(_index: number, point: TrendPoint): string {
    return point.id;
  }

  trackByFrequency(_index: number, item: FrequencyItem): string {
    return item.label;
  }

  private visibleTrendEntries(entries: readonly MoodEntry[]): readonly MoodEntry[] {
    return entries.length > MAX_TREND_POINTS ? entries.slice(-MAX_TREND_POINTS) : entries;
  }

  private collectEntryValues(entries: readonly MoodEntry[], key: 'emotions' | 'influences'): string[] {
    return entries.reduce<string[]>((items, entry) => {
      items.push(...entry[key]);

      return items;
    }, []);
  }

  private topItems(values: readonly string[]): FrequencyItem[] {
    const counts = values.reduce<Map<string, number>>((items, value) => {
      items.set(value, (items.get(value) ?? 0) + 1);

      return items;
    }, new Map());

    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, 3);
  }

  private configLabel<T extends EmotionOption | InfluenceOption>(label: string, options: readonly T[]): string {
    const option = options.find((item) => item.label === label);

    return this.localization.configLabel(option ?? label);
  }

  private countEntriesByDay(entries: readonly MoodEntry[]): Map<string, number> {
    return entries.reduce<Map<string, number>>((counts, entry) => {
      const iso = this.isoDayFromDate(this.toDate(entry.createdAt));

      counts.set(iso, (counts.get(iso) ?? 0) + 1);

      return counts;
    }, new Map());
  }

  private normalizeMoodLevel(level: number): number {
    if (!Number.isFinite(level)) {
      return 4;
    }

    return Math.min(7, Math.max(1, Math.round(level)));
  }

  private toDate(value: string): Date {
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  private isoDayFromDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private dateFromIsoDay(iso: string): Date {
    const [year, month, day] = iso.split('-').map(Number);

    if (!year || !month || !day) {
      return new Date();
    }

    return new Date(year, month - 1, day);
  }
}
