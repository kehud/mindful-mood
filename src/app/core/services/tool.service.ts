import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, getDoc, getDocs, query, where } from '@angular/fire/firestore';

import {
  ToolCategory,
  ToolDefinition,
  ToolLocalizedText,
  ToolPromptText,
  ToolRecommendationTags,
  ToolSessionMode,
  ToolTemplate,
} from '../models/tool.model';

@Injectable({
  providedIn: 'root',
})
export class ToolService {
  private readonly firestore = inject(Firestore);
  private readonly toolsCollectionPath = 'tools';

  async getEnabledTools(): Promise<ToolDefinition[]> {
    const toolsRef = collection(this.firestore, this.toolsCollectionPath);
    const toolsQuery = query(toolsRef, where('enabled', '==', true));
    const toolsSnapshot = await getDocs(toolsQuery);
    const tools = toolsSnapshot.docs
      .map((snapshot) => this.toToolDefinition(snapshot.id, snapshot.data()))
      .filter((tool): tool is ToolDefinition => tool !== null)
      .filter((tool) => tool.enabled);

    return this.sortByOrder(tools);
  }

  async getToolById(toolId: string): Promise<ToolDefinition | null> {
    const normalizedToolId = this.normalizeToolId(toolId);
    const toolSnapshot = await getDoc(doc(this.firestore, this.toolsCollectionPath, normalizedToolId));

    return toolSnapshot.exists()
      ? this.toToolDefinition(toolSnapshot.id, toolSnapshot.data())
      : null;
  }

  private toToolDefinition(id: string, data: unknown): ToolDefinition | null {
    if (!isRecord(data)) {
      return null;
    }

    const enabled = readBoolean(data, 'enabled');
    const type = readOptionalString(data, 'type');
    const momentCategory = readOptionalString(data, 'momentCategory');
    const category = readToolCategory(data, 'category');
    const template = readToolTemplate(data, 'template');
    const sessionMode = readOptionalToolSessionMode(data, 'sessionMode');
    const iconKey = readString(data, 'iconKey');
    const durationSeconds = readOptionalNumber(data, 'durationSeconds');
    const enableHaptics = readOptionalBoolean(data, 'enableHaptics');
    const title = readLocalizedText(data, 'title');
    const description = readLocalizedText(data, 'description');
    const prompt = readOptionalLocalizedTextOrString(data, 'prompt');
    const actionPrompt = readOptionalLocalizedTextOrString(data, 'actionPrompt');
    const icon = readOptionalString(data, 'icon');
    const emoji = readOptionalString(data, 'emoji');
    const microPrompt = readOptionalLocalizedText(data, 'microPrompt');
    const completionText = readOptionalLocalizedText(data, 'completionText');
    const steps = readOptionalLocalizedTextArray(data, 'steps');
    const recommendationTags = readRecommendationTags(data, 'recommendationTags');
    const order = readOptionalNumber(data, 'order');

    if (
      enabled === null ||
      category === null ||
      template === null ||
      sessionMode === null ||
      iconKey === null ||
      durationSeconds === null ||
      enableHaptics === null ||
      title === null ||
      description === null ||
      prompt === null ||
      actionPrompt === null ||
      icon === null ||
      emoji === null ||
      microPrompt === null ||
      completionText === null ||
      steps === null ||
      recommendationTags === null ||
      order === null
    ) {
      return null;
    }

    return {
      id,
      ...(type ? { type } : {}),
      ...(momentCategory ? { momentCategory } : {}),
      enabled,
      category,
      template,
      ...(sessionMode ? { sessionMode } : {}),
      iconKey,
      ...(durationSeconds !== undefined ? { durationSeconds } : {}),
      ...(enableHaptics !== undefined ? { enableHaptics } : {}),
      title,
      description,
      ...(prompt !== undefined ? { prompt } : {}),
      ...(actionPrompt !== undefined ? { actionPrompt } : {}),
      ...(icon !== undefined ? { icon } : {}),
      ...(emoji !== undefined ? { emoji } : {}),
      ...(microPrompt ? { microPrompt } : {}),
      ...(completionText ? { completionText } : {}),
      ...(steps ? { steps } : {}),
      recommendationTags,
      ...(order !== undefined ? { order } : {}),
      ...(data['createdAt'] !== undefined ? { createdAt: data['createdAt'] } : {}),
      ...(data['updatedAt'] !== undefined ? { updatedAt: data['updatedAt'] } : {}),
    };
  }

  private sortByOrder(tools: readonly ToolDefinition[]): ToolDefinition[] {
    return [...tools].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }

      if (a.order !== undefined) {
        return -1;
      }

      if (b.order !== undefined) {
        return 1;
      }

      return a.id.localeCompare(b.id);
    });
  }

  private normalizeToolId(toolId: string): string {
    const normalizedToolId = toolId.trim();

    if (!normalizedToolId || normalizedToolId.includes('/')) {
      throw new Error('Tool id must be a non-empty Firestore document id.');
    }

    return normalizedToolId;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];

  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readOptionalString(data: Record<string, unknown>, key: string): string | null | undefined {
  const value = data[key];

  if (value === undefined) {
    return undefined;
  }

  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readBoolean(data: Record<string, unknown>, key: string): boolean | null {
  const value = data[key];

  return typeof value === 'boolean' ? value : null;
}

function readOptionalBoolean(data: Record<string, unknown>, key: string): boolean | null | undefined {
  const value = data[key];

  if (value === undefined) {
    return undefined;
  }

  return typeof value === 'boolean' ? value : null;
}

function readOptionalNumber(data: Record<string, unknown>, key: string): number | null | undefined {
  const value = data[key];

  if (value === undefined) {
    return undefined;
  }

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readToolCategory(data: Record<string, unknown>, key: string): ToolCategory | null {
  const value = readString(data, key);

  return value === 'therapeutic' || value === 'personal' || value === 'growth'
    ? value
    : null;
}

function readToolTemplate(data: Record<string, unknown>, key: string): ToolTemplate | null {
  const value = readString(data, key);

  return value === 'therapeutic_session' || value === 'personal_activity' || value === 'growth_action'
    ? value
    : null;
}

function readOptionalToolSessionMode(
  data: Record<string, unknown>,
  key: string,
): ToolSessionMode | null | undefined {
  const value = data[key];

  if (value === undefined) {
    return undefined;
  }

  return value === 'timer' || value === 'guided_steps' || value === 'timer_guided_steps'
    ? value
    : null;
}

function readLocalizedText(data: Record<string, unknown>, key: string): ToolLocalizedText | null {
  const value = data[key];

  if (!isRecord(value)) {
    return null;
  }

  const en = readString(value, 'en');
  const he = readString(value, 'he');

  return en === null || he === null ? null : { en, he };
}

function readOptionalLocalizedText(
  data: Record<string, unknown>,
  key: string,
): ToolLocalizedText | null | undefined {
  const value = data[key];

  if (value === undefined) {
    return undefined;
  }

  return readLocalizedText(data, key);
}

function readOptionalLocalizedTextOrString(
  data: Record<string, unknown>,
  key: string,
): ToolPromptText | null | undefined {
  const value = data[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value.trim() ? value.trim() : null;
  }

  return readLocalizedText(data, key);
}

function readOptionalLocalizedTextArray(
  data: Record<string, unknown>,
  key: string,
): ToolLocalizedText[] | null | undefined {
  const value = data[key];

  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const localizedTextItems: ToolLocalizedText[] = [];

  for (const item of value) {
    if (!isRecord(item)) {
      return null;
    }

    const en = readString(item, 'en');
    const he = readString(item, 'he');

    if (en === null || he === null) {
      return null;
    }

    localizedTextItems.push({ en, he });
  }

  return localizedTextItems;
}

function readRecommendationTags(
  data: Record<string, unknown>,
  key: string,
): ToolRecommendationTags | null {
  const value = data[key];

  if (!isRecord(value)) {
    return null;
  }

  const emotions = readStringArray(value, 'emotions');
  const influences = readStringArray(value, 'influences');
  const moods = readNumberArray(value, 'moods');
  const activities = readStringArray(value, 'activities');

  return emotions === null || influences === null || moods === null || activities === null
    ? null
    : { emotions, influences, moods, activities };
}

function readStringArray(data: Record<string, unknown>, key: string): string[] | null {
  const value = data[key];

  if (!Array.isArray(value)) {
    return null;
  }

  const strings: string[] = [];

  for (const item of value) {
    if (typeof item !== 'string' || !item.trim()) {
      return null;
    }

    strings.push(item.trim());
  }

  return strings;
}

function readNumberArray(data: Record<string, unknown>, key: string): number[] | null {
  const value = data[key];

  if (!Array.isArray(value)) {
    return null;
  }

  const numbers: number[] = [];

  for (const item of value) {
    if (typeof item !== 'number' || !Number.isFinite(item)) {
      return null;
    }

    numbers.push(item);
  }

  return numbers;
}
