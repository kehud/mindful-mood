import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, getDocs, increment, setDoc } from '@angular/fire/firestore';
import { firstValueFrom, take } from 'rxjs';

import { ToolEngagement, ToolEngagementMap } from '../models/recommendation.model';
import { AuthService } from './auth.service';

type ToolEngagementEvent = 'shown' | 'opened';

@Injectable({
  providedIn: 'root',
})
export class EngagementService {
  private readonly authService = inject(AuthService);
  private readonly firestore = inject(Firestore);

  async trackToolShown(toolId: string): Promise<void> {
    await this.trackToolEngagement(toolId, 'shown');
  }

  async trackToolOpened(toolId: string): Promise<void> {
    await this.trackToolEngagement(toolId, 'opened');
  }

  async loadToolEngagementMap(userId: string): Promise<ToolEngagementMap> {
    const engagementSnapshot = await getDocs(collection(this.firestore, this.engagementCollectionPath(userId)));

    return engagementSnapshot.docs.reduce<Record<string, ToolEngagement | undefined>>((engagementMap, snapshot) => {
      const engagement = this.toToolEngagement(snapshot.id, snapshot.data());

      if (engagement) {
        engagementMap[engagement.toolId] = engagement;
      }

      return engagementMap;
    }, {});
  }

  private async trackToolEngagement(toolId: string, event: ToolEngagementEvent): Promise<void> {
    const normalizedToolId = this.normalizeToolId(toolId);
    const user = await firstValueFrom(this.authService.currentUser$.pipe(take(1)));

    if (!user) {
      return;
    }

    const now = new Date().toISOString();
    const engagementRef = doc(this.firestore, this.engagementPath(user.uid, normalizedToolId));
    const eventPatch = event === 'shown'
      ? { shownCount: increment(1), openedCount: increment(0), lastShownAt: now }
      : { shownCount: increment(0), openedCount: increment(1), lastOpenedAt: now };

    await setDoc(
      engagementRef,
      {
        userId: user.uid,
        toolId: normalizedToolId,
        updatedAt: now,
        ...eventPatch,
      },
      { merge: true },
    );
  }

  private engagementPath(userId: string, toolId: string): string {
    return `${this.engagementCollectionPath(userId)}/${toolId}`;
  }

  private engagementCollectionPath(userId: string): string {
    return `users/${userId}/toolEngagement`;
  }

  private normalizeToolId(toolId: string): string {
    const normalizedToolId = toolId.trim();

    if (!normalizedToolId || normalizedToolId.includes('/')) {
      throw new Error('Tool id must be a non-empty Firestore document id.');
    }

    return normalizedToolId;
  }

  private toToolEngagement(id: string, data: Record<string, unknown>): ToolEngagement | null {
    const userId = readString(data, 'userId');
    const toolId = readString(data, 'toolId') ?? id;
    const shownCount = readNumber(data, 'shownCount') ?? 0;
    const openedCount = readNumber(data, 'openedCount') ?? 0;
    const updatedAt = readString(data, 'updatedAt') ?? new Date(0).toISOString();
    const lastShownAt = readString(data, 'lastShownAt');
    const lastOpenedAt = readString(data, 'lastOpenedAt');

    if (!userId || !toolId) {
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
