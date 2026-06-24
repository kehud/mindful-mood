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
  readonly icon?: string;
  readonly order?: number;
}

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

    const description = this.readDisplayText(data, 'description');
    const icon = readString(data, 'icon');

    return {
      id,
      title: this.readDisplayText(data, 'title') ?? this.readDisplayText(data, 'name') ?? id,
      ...(description ? { description } : {}),
      ...(icon ? { icon } : {}),
    };
  }

  private toCategoryToolListItem(id: string, data: unknown): CategoryToolListItem | null {
    if (!isRecord(data)) {
      return null;
    }

    const description = this.readDisplayText(data, 'shortDescription') ?? this.readDisplayText(data, 'description');
    const icon = readString(data, 'icon');
    const order = readOptionalNumber(data, 'order');

    return {
      id,
      title: this.readDisplayText(data, 'title') ?? this.readDisplayText(data, 'name') ?? id,
      ...(description ? { description } : {}),
      ...(icon ? { icon } : {}),
      ...(order !== undefined ? { order } : {}),
    };
  }

  private readDisplayText(data: Record<string, unknown>, key: string): string | null {
    return readDisplayText(data, key, this.localization.currentLanguage());
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
