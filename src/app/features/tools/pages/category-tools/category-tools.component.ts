import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Firestore, collection, doc, getDoc, getDocs, query, where } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { catchError, distinctUntilChanged, from, map, of, shareReplay, startWith, switchMap } from 'rxjs';

import { LocalizationService } from '../../../../core/services/localization.service';

interface CategoryToolsState {
  readonly loading: boolean;
  readonly categoryId: string;
  readonly category: MomentCategoryDetails | null;
  readonly tools: CategoryToolListItem[];
}

interface MomentCategoryDetails {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly icon?: string;
}

interface CategoryToolListItem {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly icon: string;
  readonly emoji?: string;
  readonly durationLabel?: string;
  readonly order?: number;
}

const CATEGORY_ICON_NAMES_BY_KEY: Readonly<Record<string, string>> = {
  breathing: 'radio-button-on-outline',
  create: 'color-palette-outline',
  friend: 'people-circle-outline',
  goal: 'flag-outline',
  gratitude: 'sparkles-outline',
  grounding: 'leaf-outline',
  learn: 'school-outline',
  meditation: 'sparkles-outline',
  music: 'musical-notes-outline',
  reflect: 'pencil-outline',
  sleep: 'moon-outline',
  walk: 'walk-outline',
};

const TOOL_ICON_NAMES_BY_KEY: Readonly<Record<string, string>> = {
  body: 'body-outline',
  breathing: 'radio-button-on-outline',
  create: 'color-palette-outline',
  friend: 'people-circle-outline',
  goal: 'flag-outline',
  gratitude: 'sparkles-outline',
  grounding: 'scan-outline',
  learn: 'school-outline',
  meditation: 'leaf-outline',
  music: 'musical-notes-outline',
  nature: 'flower-outline',
  photography: 'camera-outline',
  reading: 'book-outline',
  reflect: 'pencil-outline',
  sleep: 'moon-outline',
  walk: 'walk-outline',
};

const DEFAULT_CATEGORY_ICON_NAME = 'sparkles-outline';
const DEFAULT_TOOL_ICON_NAME = 'sparkles-outline';

@Component({
  selector: 'app-category-tools',
  templateUrl: './category-tools.component.html',
  styleUrls: ['./category-tools.component.scss'],
  standalone: true,
  imports: [AsyncPipe, IonicModule, NgFor, NgIf],
})
export class CategoryToolsComponent {
  private readonly firestore = inject(Firestore);
  private readonly localization = inject(LocalizationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly currentLanguage = this.localization.currentLanguage;

  readonly categoryState$ = this.route.paramMap.pipe(
    map((params) => params.get('categoryId')?.trim() ?? ''),
    distinctUntilChanged(),
    switchMap((categoryId) => {
      if (!categoryId) {
        return of<CategoryToolsState>({
          loading: false,
          categoryId,
          category: null,
          tools: [],
        });
      }

      return from(this.loadCategoryToolsState(categoryId)).pipe(
        map(({ category, tools }): CategoryToolsState => ({
          loading: false,
          categoryId,
          category,
          tools,
        })),
        catchError(() =>
          of<CategoryToolsState>({
            loading: false,
            categoryId,
            category: null,
            tools: [],
          }),
        ),
        startWith({
          loading: true,
          categoryId,
          category: null,
          tools: [],
        } satisfies CategoryToolsState),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  trackTool(_index: number, tool: CategoryToolListItem): string {
    return tool.id;
  }

  openTool(tool: CategoryToolListItem): void {
    void this.router.navigate(['/tools', tool.id]);
  }

  backToTools(): void {
    void this.router.navigate(['/tabs/tools']);
  }

  private async loadCategoryToolsState(
    categoryId: string,
  ): Promise<{ category: MomentCategoryDetails | null; tools: CategoryToolListItem[] }> {
    const normalizedCategoryId = normalizeCategoryId(categoryId);
    const [category, tools] = await Promise.all([
      this.loadCategory(normalizedCategoryId),
      this.loadTools(normalizedCategoryId),
    ]);

    return { category, tools };
  }

  private async loadCategory(categoryId: string): Promise<MomentCategoryDetails | null> {
    const categorySnapshot = await getDoc(doc(this.firestore, 'momentCategories', categoryId));

    return categorySnapshot.exists()
      ? this.toMomentCategoryDetails(categorySnapshot.id, categorySnapshot.data())
      : null;
  }

  private async loadTools(categoryId: string): Promise<CategoryToolListItem[]> {
    const toolsQuery = query(
      collection(this.firestore, 'tools'),
      where('momentCategory', '==', categoryId),
    );
    const toolsSnapshot = await getDocs(toolsQuery);

    return toolsSnapshot.docs
      .map((snapshot) => this.toCategoryToolListItem(snapshot.id, snapshot.data()))
      .filter((tool): tool is CategoryToolListItem => tool !== null)
      .sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }

        if (a.order !== undefined) {
          return -1;
        }

        if (b.order !== undefined) {
          return 1;
        }

        return a.title.localeCompare(b.title);
      });
  }

  private toMomentCategoryDetails(id: string, data: unknown): MomentCategoryDetails | null {
    if (!isRecord(data)) {
      return null;
    }

    const description =
      this.readDisplayText(data, 'description') ??
      this.readDisplayText(data, 'shortDescription') ??
      this.readDisplayText(data, 'subtitle') ??
      this.readDisplayText(data, 'summary');
    const iconKey = readString(data, 'iconKey') ?? id;

    return {
      id,
      title: this.readDisplayText(data, 'title') ?? this.readDisplayText(data, 'name') ?? id,
      ...(description ? { description } : {}),
      icon: readString(data, 'icon') ?? iconNameForCategoryKey(iconKey),
    };
  }

  private toCategoryToolListItem(id: string, data: unknown): CategoryToolListItem | null {
    if (!isRecord(data)) {
      return null;
    }

    const description = this.readDisplayText(data, 'shortDescription') ?? this.readDisplayText(data, 'description');
    const iconKey = readString(data, 'iconKey');
    const emoji = readString(data, 'emoji');
    const durationLabel = this.readDurationLabel(data);
    const order = readOptionalNumber(data, 'order');

    return {
      id,
      title: this.readDisplayText(data, 'title') ?? this.readDisplayText(data, 'name') ?? id,
      ...(description ? { description } : {}),
      icon: readString(data, 'icon') ?? (iconKey ? iconNameForToolKey(iconKey) : DEFAULT_TOOL_ICON_NAME),
      ...(emoji ? { emoji } : {}),
      ...(durationLabel ? { durationLabel } : {}),
      ...(order !== undefined ? { order } : {}),
    };
  }

  private readDisplayText(data: Record<string, unknown>, key: string): string | null {
    return readDisplayText(data, key, this.localization.currentLanguage());
  }

  private readDurationLabel(data: Record<string, unknown>): string | null {
    const textDuration =
      this.readDisplayText(data, 'durationLabel') ??
      this.readDisplayText(data, 'estimatedDuration') ??
      this.readDisplayText(data, 'duration');

    if (textDuration) {
      return textDuration;
    }

    const durationSeconds = readOptionalNumber(data, 'durationSeconds');

    if (durationSeconds !== undefined) {
      return formatSecondsDuration(durationSeconds);
    }

    const duration = readOptionalNumber(data, 'duration');

    if (duration !== undefined) {
      return duration >= 30 ? formatSecondsDuration(duration) : formatMinutesDuration(duration);
    }

    const estimatedMinutes = readOptionalNumber(data, 'estimatedMinutes');

    if (estimatedMinutes !== undefined) {
      return formatMinutesDuration(estimatedMinutes);
    }

    const minutes = readOptionalNumber(data, 'minutes');

    if (minutes !== undefined) {
      return formatMinutesDuration(minutes);
    }

    const estimatedMinutesText = readString(data, 'estimatedMinutes');

    if (estimatedMinutesText) {
      return formatMaybeMinutesText(estimatedMinutesText);
    }

    const minutesText = readString(data, 'minutes');

    return minutesText ? formatMaybeMinutesText(minutesText) : null;
  }
}

function normalizeCategoryId(categoryId: string): string {
  const normalizedCategoryId = categoryId.trim();

  if (!normalizedCategoryId || normalizedCategoryId.includes('/')) {
    throw new Error('Category id must be a non-empty Firestore document id.');
  }

  return normalizedCategoryId;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readDisplayText(data: Record<string, unknown>, key: string, language: 'en' | 'he'): string | null {
  const value = data[key];

  if (typeof value === 'string') {
    return value.trim() || null;
  }

  if (!isRecord(value)) {
    return null;
  }

  if (language === 'he') {
    return readString(value, 'he') ?? readString(value, 'en');
  }

  return readString(value, 'en') ?? readString(value, 'he');
}

function readString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];

  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readOptionalNumber(data: Record<string, unknown>, key: string): number | undefined {
  const value = data[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function iconNameForCategoryKey(iconKey: string): string {
  return CATEGORY_ICON_NAMES_BY_KEY[iconKey] ?? (isLikelyIonicIconName(iconKey) ? iconKey : DEFAULT_CATEGORY_ICON_NAME);
}

function iconNameForToolKey(iconKey: string): string {
  return TOOL_ICON_NAMES_BY_KEY[iconKey] ?? (isLikelyIonicIconName(iconKey) ? iconKey : DEFAULT_TOOL_ICON_NAME);
}

function isLikelyIonicIconName(value: string): boolean {
  return value.endsWith('-outline') || value.endsWith('-sharp');
}

function formatSecondsDuration(value: number): string {
  const totalSeconds = Math.max(1, Math.round(value));

  if (totalSeconds < 60) {
    return `${totalSeconds} sec`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return seconds ? `${minutes} min ${seconds} sec` : formatMinutesDuration(minutes);
}

function formatMinutesDuration(value: number): string {
  const minutes = Math.max(1, Math.round(value));

  return `${minutes} min`;
}

function formatMaybeMinutesText(value: string): string {
  return /^\d+(\.\d+)?$/.test(value) ? formatMinutesDuration(Number(value)) : value;
}
