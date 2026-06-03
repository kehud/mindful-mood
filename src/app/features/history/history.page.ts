import { AsyncPipe, NgFor, NgIf } from '@angular/common';
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

type JourneyRangeKey = '7d' | '30d' | '90d' | 'all';

interface TimeFilterOption {
  readonly key: JourneyRangeKey;
  readonly labelKey: string;
}

interface TrendPoint {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly level: number;
  readonly color: string;
}

interface TrendBucket {
  readonly id: string;
  readonly label: string;
  readonly averageMood: number;
  readonly count: number;
}

interface FrequencyItem {
  readonly label: string;
  readonly count: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_CHECK_INS_LIMIT = 5;
const SEGMENTED_TREND_BUCKETS = 6;

const TIME_FILTERS: readonly TimeFilterOption[] = [
  { key: '7d', labelKey: 'history.range7d' },
  { key: '30d', labelKey: 'history.range30d' },
  { key: '90d', labelKey: 'history.range90d' },
  { key: 'all', labelKey: 'history.rangeAll' },
];

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
  readonly timeFilters = TIME_FILTERS;

  selectedRange: JourneyRangeKey = '7d';

  selectRange(range: JourneyRangeKey): void {
    this.selectedRange = range;
  }

  periodEntries(entries: readonly MoodEntry[]): readonly MoodEntry[] {
    const selectedRange = this.selectedRange;

    if (selectedRange === 'all') {
      return [...entries];
    }

    const startDate = this.rangeStartDate(selectedRange);

    return entries.filter((entry) => this.toDate(entry.createdAt) >= startDate);
  }

  recentEntries(entries: readonly MoodEntry[]): readonly MoodEntry[] {
    return entries.slice(0, RECENT_CHECK_INS_LIMIT);
  }

  selectedRangeLabel(): string {
    const activeFilter = this.timeFilters.find((filter) => filter.key === this.selectedRange);

    return this.localization.translate(activeFilter?.labelKey ?? 'history.range7d');
  }

  periodCountLabel(count: number): string {
    return this.localization.translate(
      count === 1 ? 'history.checkInsCountOne' : 'history.checkInsCountMany',
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

  moodTrendAriaLabel(): string {
    return this.localization.translate('history.moodTrendAria', {
      range: this.selectedRangeLabel(),
    });
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

  recentEntryTimeLabel(value: string): string {
    const date = this.toDate(value);

    if (this.isoDayFromDate(date) === this.isoDayFromDate(new Date())) {
      return this.timeLabel(value);
    }

    return new Intl.DateTimeFormat(this.currentLanguage(), {
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  entrySummary(
    entry: MoodEntry,
    emotionOptions: readonly EmotionOption[],
    influenceOptions: readonly InfluenceOption[],
  ): string {
    const emotionLabels = entry.emotions.map((emotion) => this.configLabel(emotion, emotionOptions));
    const influenceLabels = entry.influences.map((influence) => this.configLabel(influence, influenceOptions));
    const labels = [...emotionLabels, ...influenceLabels].filter(Boolean);
    const visibleLabels = labels.slice(0, 2);
    const remainingCount = labels.length - visibleLabels.length;

    if (!visibleLabels.length) {
      return entry.journalNote
        ? this.localization.translate('history.noteSaved')
        : this.localization.translate('history.noTagsSaved');
    }

    return remainingCount
      ? `${visibleLabels.join(', ')} +${remainingCount}`
      : visibleLabels.join(', ');
  }

  trendPoints(entries: readonly MoodEntry[], moodOptions: readonly MoodOption[]): TrendPoint[] {
    const buckets = this.trendBuckets(entries).filter((bucket) => bucket.count > 0);
    const chartStartX = 16;
    const chartEndX = 304;
    const chartTopY = 24;
    const chartBottomY = 114;
    const spanX = chartEndX - chartStartX;
    const spanY = chartBottomY - chartTopY;

    return buckets.map((bucket, index) => {
      const x = buckets.length === 1
        ? chartStartX + spanX / 2
        : chartStartX + (spanX / (buckets.length - 1)) * index;
      const level = this.normalizeMoodLevel(bucket.averageMood);
      const y = chartBottomY - ((bucket.averageMood - 1) / 6) * spanY;

      return {
        id: bucket.id,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        label: bucket.label,
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

  topEmotionItem(entries: readonly MoodEntry[]): FrequencyItem | null {
    return this.topItems(this.collectEntryValues(entries, 'emotions'))[0] ?? null;
  }

  topInfluenceItem(entries: readonly MoodEntry[]): FrequencyItem | null {
    return this.topItems(this.collectEntryValues(entries, 'influences'))[0] ?? null;
  }

  topEmotionIcon(entries: readonly MoodEntry[], options: readonly EmotionOption[]): string {
    const emotion = this.topEmotionItem(entries);

    return emotion ? this.emotionIcon(emotion.label, options) : 'sparkles-outline';
  }

  topInfluenceIcon(entries: readonly MoodEntry[], options: readonly InfluenceOption[]): string {
    const influence = this.topInfluenceItem(entries);

    return influence ? this.influenceIcon(influence.label, options) : 'compass-outline';
  }

  emotionIcon(label: string, options: readonly EmotionOption[]): string {
    return EMOTION_ICONS[this.configLabel(label, options)] ?? EMOTION_ICONS[label] ?? 'sparkles-outline';
  }

  influenceIcon(label: string, options: readonly InfluenceOption[]): string {
    return INFLUENCE_ICONS[this.configLabel(label, options)] ?? INFLUENCE_ICONS[label] ?? 'ellipse-outline';
  }

  reflectionText(entries: readonly MoodEntry[], moodOptions: readonly MoodOption[]): string {
    if (!entries.length) {
      return this.localization.translate('history.reflectionEmpty');
    }

    return this.localization.translate('history.reflectionCopy', {
      mood: this.moodLabel(this.averageMood(entries), moodOptions),
    });
  }

  patternText(
    entries: readonly MoodEntry[],
    emotionOptions: readonly EmotionOption[],
    influenceOptions: readonly InfluenceOption[],
  ): string {
    const emotion = this.topEmotionItem(entries);
    const influence = this.topInfluenceItem(entries);

    if (emotion && influence) {
      return this.localization.translate('history.patternCopyBoth', {
        emotion: this.configLabel(emotion.label, emotionOptions),
        influence: this.configLabel(influence.label, influenceOptions),
      });
    }

    if (emotion) {
      return this.localization.translate('history.patternCopyEmotion', {
        emotion: this.configLabel(emotion.label, emotionOptions),
      });
    }

    if (influence) {
      return this.localization.translate('history.patternCopyInfluence', {
        influence: this.configLabel(influence.label, influenceOptions),
      });
    }

    return this.localization.translate('history.patternEmpty');
  }

  growthText(entries: readonly MoodEntry[]): string {
    if (!entries.length) {
      return this.localization.translate('history.growthEmpty');
    }

    return this.localization.translate(
      entries.length === 1 ? 'history.growthCopyOne' : 'history.growthCopyMany',
      { count: entries.length },
    );
  }

  currentStreak(entries: readonly MoodEntry[]): number {
    if (!entries.length) {
      return 0;
    }

    const entryDays = new Set(entries.map((entry) => this.isoDayFromDate(this.toDate(entry.createdAt))));
    let cursor = this.startOfDay(new Date());

    if (!entryDays.has(this.isoDayFromDate(cursor))) {
      const yesterday = new Date(cursor.getTime() - DAY_MS);

      if (!entryDays.has(this.isoDayFromDate(yesterday))) {
        return 0;
      }

      cursor = yesterday;
    }

    let streak = 0;

    while (entryDays.has(this.isoDayFromDate(cursor))) {
      streak += 1;
      cursor = new Date(cursor.getTime() - DAY_MS);
    }

    return streak;
  }

  streakLabel(count: number): string {
    return this.localization.translate(
      count === 1 ? 'history.streakDayOne' : 'history.streakDayMany',
      { count },
    );
  }

  streakDetailLabel(count: number): string {
    return this.localization.translate(count ? 'history.keepItUp' : 'history.startGently');
  }

  trackByTimeFilter(_index: number, filter: TimeFilterOption): string {
    return filter.key;
  }

  trackByEntryId(_index: number, entry: MoodEntry): string {
    return entry.id;
  }

  trackByPoint(_index: number, point: TrendPoint): string {
    return point.id;
  }

  private trendBuckets(entries: readonly MoodEntry[]): TrendBucket[] {
    const selectedRange = this.selectedRange;
    const sortedEntries = [...entries].sort(
      (a, b) => this.toDate(a.createdAt).getTime() - this.toDate(b.createdAt).getTime(),
    );

    if (!sortedEntries.length) {
      return [];
    }

    if (selectedRange === '7d') {
      return this.dailyTrendBuckets(sortedEntries);
    }

    if (selectedRange === 'all') {
      return this.allTimeTrendBuckets(sortedEntries);
    }

    return this.segmentedTrendBuckets(
      sortedEntries,
      this.rangeStartDate(selectedRange),
      this.endOfDay(new Date()),
      SEGMENTED_TREND_BUCKETS,
    );
  }

  private dailyTrendBuckets(entries: readonly MoodEntry[]): TrendBucket[] {
    const startDate = this.rangeStartDate('7d');

    return Array.from({ length: 7 }, (_, index) => {
      const bucketDate = new Date(startDate.getTime() + index * DAY_MS);
      const iso = this.isoDayFromDate(bucketDate);
      const bucketEntries = entries.filter((entry) => this.isoDayFromDate(this.toDate(entry.createdAt)) === iso);

      return this.createTrendBucket(
        iso,
        new Intl.DateTimeFormat(this.currentLanguage(), { weekday: 'short' }).format(bucketDate),
        bucketEntries,
      );
    });
  }

  private allTimeTrendBuckets(entries: readonly MoodEntry[]): TrendBucket[] {
    const uniqueDays = Array.from(new Set(entries.map((entry) => this.isoDayFromDate(this.toDate(entry.createdAt)))));

    if (uniqueDays.length <= 7) {
      return uniqueDays.map((iso) => {
        const bucketDate = this.dateFromIsoDay(iso);
        const bucketEntries = entries.filter((entry) => this.isoDayFromDate(this.toDate(entry.createdAt)) === iso);

        return this.createTrendBucket(
          iso,
          new Intl.DateTimeFormat(this.currentLanguage(), { month: 'short', day: 'numeric' }).format(bucketDate),
          bucketEntries,
        );
      });
    }

    return this.segmentedTrendBuckets(
      entries,
      this.startOfDay(this.toDate(entries[0].createdAt)),
      this.endOfDay(this.toDate(entries[entries.length - 1].createdAt)),
      7,
    );
  }

  private segmentedTrendBuckets(
    entries: readonly MoodEntry[],
    startDate: Date,
    endDate: Date,
    bucketCount: number,
  ): TrendBucket[] {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    const bucketSpan = Math.max(DAY_MS, (endTime - startTime + 1) / bucketCount);

    return Array.from({ length: bucketCount }, (_, index) => {
      const bucketStart = new Date(startTime + bucketSpan * index);
      const bucketEndTime = index === bucketCount - 1 ? endTime + 1 : startTime + bucketSpan * (index + 1);
      const bucketEntries = entries.filter((entry) => {
        const entryTime = this.toDate(entry.createdAt).getTime();

        return entryTime >= bucketStart.getTime() && entryTime < bucketEndTime;
      });

      return this.createTrendBucket(
        `${this.selectedRange}-${index}`,
        new Intl.DateTimeFormat(this.currentLanguage(), { month: 'short', day: 'numeric' }).format(bucketStart),
        bucketEntries,
      );
    });
  }

  private createTrendBucket(id: string, label: string, entries: readonly MoodEntry[]): TrendBucket {
    return {
      id,
      label,
      averageMood: this.averageMood(entries),
      count: entries.length,
    };
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

  private rangeStartDate(range: Exclude<JourneyRangeKey, 'all'>): Date {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = this.startOfDay(new Date());

    startDate.setDate(startDate.getDate() - (days - 1));

    return startDate;
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

  private startOfDay(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    return start;
  }

  private endOfDay(date: Date): Date {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return end;
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
