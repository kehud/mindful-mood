import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  where,
} from '@angular/fire/firestore';

import { ToolEngagement, ToolEngagementMap } from '../models/recommendation.model';
import { AuthService } from './auth.service';

type ToolEngagementAction = 'shown' | 'opened' | 'completed';
type ToolEngagementCountField = 'shownCount' | 'openedCount' | 'completedCount';
type ToolEngagementTimestampField = 'lastShownAt' | 'lastOpenedAt' | 'lastCompletedAt';
type ToolEventSource = string;
type GlobalStatsCollection = 'toolStats' | 'categoryStats';

export interface TrackableTool {
  id?: string | null;
  type?: string | null;
  momentCategory?: string | null;
}

interface NormalizedTool {
  id: string;
  type: string;
  momentCategory: string;
  categoryStatsId: string | null;
}

interface GlobalStatsCounts {
  shownCount: number;
  openedCount: number;
  completedCount: number;
}

interface ToolEventMoodSnapshot {
  moodLevel: number;
  emotions: string[];
  influences: string[];
  checkInId: string;
}

interface LatestMoodEntrySnapshot extends ToolEventMoodSnapshot {
  createdAtMs: number;
}

const DEFAULT_EVENT_SOURCE = 'unknown';

const TOOL_ENGAGEMENT_FIELDS: Record<
  ToolEngagementAction,
  {
    countField: ToolEngagementCountField;
    timestampField: ToolEngagementTimestampField;
  }
> = {
  shown: {
    countField: 'shownCount',
    timestampField: 'lastShownAt',
  },
  opened: {
    countField: 'openedCount',
    timestampField: 'lastOpenedAt',
  },
  completed: {
    countField: 'completedCount',
    timestampField: 'lastCompletedAt',
  },
};

@Injectable({
  providedIn: 'root',
})
export class EngagementService {
  private readonly authService = inject(AuthService);
  private readonly firestore = inject(Firestore);

  trackToolShown(tool: TrackableTool, source: ToolEventSource): Promise<void>;
  trackToolShown(toolId: string): Promise<void>;
  trackToolShown(tool: TrackableTool | string, source: ToolEventSource = DEFAULT_EVENT_SOURCE): Promise<void> {
    return this.trackToolEvent('shown', tool, source);
  }

  trackToolOpened(tool: TrackableTool, source: ToolEventSource): Promise<void>;
  trackToolOpened(toolId: string): Promise<void>;
  trackToolOpened(tool: TrackableTool | string, source: ToolEventSource = DEFAULT_EVENT_SOURCE): Promise<void> {
    return this.trackToolEvent('opened', tool, source);
  }

  trackToolCompleted(tool: TrackableTool, source: ToolEventSource): Promise<void>;
  trackToolCompleted(toolId: string): Promise<void>;
  trackToolCompleted(tool: TrackableTool | string, source: ToolEventSource = DEFAULT_EVENT_SOURCE): Promise<void> {
    return this.trackToolEvent('completed', tool, source);
  }

  async loadToolEngagementMap(userId: string): Promise<ToolEngagementMap> {
    const engagementSnapshot = await getDocs(collection(this.firestore, this.engagementCollectionPath(userId)));

    return engagementSnapshot.docs.reduce<Record<string, ToolEngagement | undefined>>((engagementMap, snapshot) => {
      const engagement = this.toToolEngagement(userId, snapshot.id, snapshot.data());

      if (engagement) {
        engagementMap[engagement.toolId] = engagement;
      }

      return engagementMap;
    }, {});
  }

  private async trackToolEvent(
    action: ToolEngagementAction,
    tool: TrackableTool | string,
    source: ToolEventSource,
  ): Promise<void> {
    const user = this.authService.currentUserSnapshot;

    if (!user) {
      return;
    }

    try {
      const normalizedTool = this.normalizeTool(tool);

      if (!normalizedTool) {
        return;
      }

      const normalizedSource = this.normalizeEventValue(source);
      const fields = TOOL_ENGAGEMENT_FIELDS[action];
      const engagementRef = doc(this.firestore, this.engagementPath(user.uid, normalizedTool.id));
      const userStatsPayload = this.countPayload(fields);
      const writeOperations: Promise<unknown>[] = [
        setDoc(engagementRef, userStatsPayload, { merge: true }),
        this.updateGlobalStats('toolStats', normalizedTool.id, fields),
        this.writeToolEvent(user.uid, action, normalizedTool, normalizedSource),
      ];

      if (normalizedTool.categoryStatsId) {
        writeOperations.push(
          this.updateGlobalStats('categoryStats', normalizedTool.categoryStatsId, fields),
        );
      }

      await Promise.all(writeOperations);
    } catch (error) {
      console.warn('Failed to track tool engagement event', error);
    }
  }

  private async writeToolEvent(
    userId: string,
    action: ToolEngagementAction,
    tool: NormalizedTool,
    source: ToolEventSource,
  ): Promise<void> {
    const moodSnapshot = await this.loadLatestMoodSnapshot(userId);

    await addDoc(collection(this.firestore, 'users', userId, 'toolEvents'), {
      action,
      toolId: tool.id,
      toolType: tool.type,
      momentCategory: tool.momentCategory,
      source,
      createdAt: serverTimestamp(),
      ...(moodSnapshot ?? {}),
    });
  }

  private async loadLatestMoodSnapshot(userId: string): Promise<ToolEventMoodSnapshot | null> {
    try {
      const entriesSnapshot = await getDocs(query(
        collection(this.firestore, 'moodEntries'),
        where('userId', '==', userId),
      ));
      const latestEntry = entriesSnapshot.docs
        .map((snapshot) => this.toLatestMoodEntrySnapshot(snapshot.id, snapshot.data()))
        .filter((entry): entry is LatestMoodEntrySnapshot => entry !== null)
        .sort((a, b) => b.createdAtMs - a.createdAtMs)[0];

      if (!latestEntry) {
        return null;
      }

      return {
        moodLevel: latestEntry.moodLevel,
        emotions: latestEntry.emotions,
        influences: latestEntry.influences,
        checkInId: latestEntry.checkInId,
      };
    } catch {
      return null;
    }
  }

  private engagementPath(userId: string, toolId: string): string {
    return `${this.engagementCollectionPath(userId)}/${toolId}`;
  }

  private engagementCollectionPath(userId: string): string {
    return `users/${userId}/toolEngagement`;
  }

  private countPayload(fields: {
    countField: ToolEngagementCountField;
    timestampField: ToolEngagementTimestampField;
  }): Record<ToolEngagementCountField | ToolEngagementTimestampField | 'updatedAt', unknown> {
    return {
      [fields.countField]: increment(1),
      [fields.timestampField]: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as Record<ToolEngagementCountField | ToolEngagementTimestampField | 'updatedAt', unknown>;
  }

  private async updateGlobalStats(
    collectionPath: GlobalStatsCollection,
    statsId: string,
    fields: {
      countField: ToolEngagementCountField;
      timestampField: ToolEngagementTimestampField;
    },
  ): Promise<void> {
    const statsRef = doc(this.firestore, collectionPath, statsId);
    const statsSnapshot = await getDoc(statsRef);
    const currentCounts = statsSnapshot.exists()
      ? this.toGlobalStatsCounts(statsSnapshot.data())
      : this.emptyGlobalStatsCounts();
    const nextCounts: GlobalStatsCounts = {
      ...currentCounts,
      [fields.countField]: currentCounts[fields.countField] + 1,
    };

    await setDoc(
      statsRef,
      {
        ...this.countPayload(fields),
        ...this.calculateGlobalRates(nextCounts),
      },
      { merge: true },
    );
  }

  private emptyGlobalStatsCounts(): GlobalStatsCounts {
    return {
      shownCount: 0,
      openedCount: 0,
      completedCount: 0,
    };
  }

  private toGlobalStatsCounts(data: Record<string, unknown>): GlobalStatsCounts {
    return {
      shownCount: readNumber(data, 'shownCount') ?? 0,
      openedCount: readNumber(data, 'openedCount') ?? 0,
      completedCount: readNumber(data, 'completedCount') ?? 0,
    };
  }

  private calculateGlobalRates(counts: GlobalStatsCounts): {
    openRate: number;
    completionRate: number;
    strengthScore: number;
  } {
    const openRate = counts.shownCount > 0 ? counts.openedCount / counts.shownCount : 0;
    const completionRate = counts.openedCount > 0 ? counts.completedCount / counts.openedCount : 0;

    return {
      openRate,
      completionRate,
      strengthScore: openRate * 0.45 + completionRate * 0.55,
    };
  }

  private normalizeTool(tool: TrackableTool | string): NormalizedTool | null {
    if (typeof tool === 'string') {
      const normalizedToolId = this.normalizeOptionalDocumentId(tool);

      if (!normalizedToolId) {
        return null;
      }

      return {
        id: normalizedToolId,
        type: DEFAULT_EVENT_SOURCE,
        momentCategory: DEFAULT_EVENT_SOURCE,
        categoryStatsId: null,
      };
    }

    const normalizedToolId = this.normalizeOptionalDocumentId(tool.id);

    if (!normalizedToolId) {
      return null;
    }

    return {
      id: normalizedToolId,
      type: this.normalizeEventValue(tool.type),
      momentCategory: this.normalizeEventValue(tool.momentCategory),
      categoryStatsId: this.normalizeOptionalDocumentId(tool.momentCategory),
    };
  }

  private normalizeOptionalDocumentId(documentId: string | null | undefined): string | null {
    const normalizedDocumentId = documentId?.trim();

    if (!normalizedDocumentId || normalizedDocumentId.includes('/')) {
      return null;
    }

    return normalizedDocumentId;
  }

  private normalizeEventValue(value: string | null | undefined): string {
    const normalizedValue = value?.trim();

    return normalizedValue || DEFAULT_EVENT_SOURCE;
  }

  private toLatestMoodEntrySnapshot(id: string, data: Record<string, unknown>): LatestMoodEntrySnapshot | null {
    const moodLevel = readNumber(data, 'moodLevel');
    const emotions = readStringArray(data, 'emotions');
    const influences = readStringArray(data, 'influences');
    const createdAt = readTimestampString(data, 'createdAt');
    const createdAtMs = createdAt ? Date.parse(createdAt) : Number.NaN;

    if (moodLevel === null || emotions === null || influences === null || !Number.isFinite(createdAtMs)) {
      return null;
    }

    return {
      moodLevel,
      emotions,
      influences,
      checkInId: id,
      createdAtMs,
    };
  }

  private toToolEngagement(userId: string, id: string, data: Record<string, unknown>): ToolEngagement | null {
    const toolId = readString(data, 'toolId') ?? id;
    const shownCount = readNumber(data, 'shownCount') ?? 0;
    const openedCount = readNumber(data, 'openedCount') ?? 0;
    const updatedAt = readTimestampString(data, 'updatedAt') ?? new Date(0).toISOString();
    const lastShownAt = readTimestampString(data, 'lastShownAt');
    const lastOpenedAt = readTimestampString(data, 'lastOpenedAt');

    if (!toolId) {
      return null;
    }

    return {
      id,
      userId,
      toolId,
      shownCount,
      openedCount,
      ...(lastShownAt ? { lastShownAt } : {}),
      ...(lastOpenedAt ? { lastOpenedAt } : {}),
      updatedAt,
    };
  }
}

function readString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];

  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readNumber(data: Record<string, unknown>, key: string): number | null {
  const value = data[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readStringArray(data: Record<string, unknown>, key: string): string[] | null {
  const value = data[key];

  if (!Array.isArray(value)) {
    return null;
  }

  return value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()));
}

function readTimestampString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (isTimestampLike(value)) {
    return value.toDate().toISOString();
  }

  return null;
}

function isTimestampLike(value: unknown): value is { toDate: () => Date } {
  return typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof value.toDate === 'function';
}
