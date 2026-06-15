import { Injectable } from '@angular/core';

import { RECOMMENDATION_TOOL_CATALOG } from '../recommendation-tool.catalog';
import { MoodEntry } from '../models/mood-entry.model';
import {
  RecommendationCategory,
  RecommendationMode,
  RecommendationResult,
  RecommendationScoreBreakdown,
  RecommendationTool,
  ToolEngagement,
  ToolEngagementMap,
  UserPreferences,
} from '../models/recommendation.model';

export const RECOMMENDATION_SCORE_WEIGHTS = {
  emotionMatch: 35,
  influenceMatch: 25,
  preferenceMatch: 20,
  moodMatch: 10,
  engagementScore: 10,
} as const satisfies RecommendationScoreBreakdown;

const DEFAULT_RECOMMENDATION_LIMIT = 4;
const MIN_RECOMMENDATION_LIMIT = 3;
const MAX_RECOMMENDATION_LIMIT = 4;

const SUPPORT_TRIGGER_LABELS = new Set([
  'anxiety',
  'anxious',
  'loneliness',
  'lonely',
  'sad',
  'sadness',
  'stress',
  'stressed',
  'overwhelmed',
]);

const GROWTH_TRIGGER_LABELS = new Set([
  'excited',
  'grateful',
  'happy',
  'hopeful',
]);

const MODE_CATEGORY_TARGETS: Record<RecommendationMode, Record<RecommendationCategory, number>> = {
  support: {
    therapeutic: 0.7,
    personal: 0.3,
    growth: 0,
  },
  growth: {
    therapeutic: 0.3,
    personal: 0.35,
    growth: 0.35,
  },
};

@Injectable({
  providedIn: 'root',
})
export class RecommendationService {
  getRecommendations(
    latestMoodEntry: MoodEntry | null | undefined,
    userPreferences: UserPreferences | null | undefined = null,
    engagementMap: ToolEngagementMap = {},
    limit = DEFAULT_RECOMMENDATION_LIMIT,
  ): RecommendationResult[] {
    const mode = this.detectMode(latestMoodEntry);
    const recommendationLimit = this.normalizeLimit(limit);
    const primaryTools = RECOMMENDATION_TOOL_CATALOG.filter((tool) =>
      (tool.supportedModes as readonly RecommendationMode[]).includes(mode),
    );
    const fallbackTools = primaryTools.length < recommendationLimit
      ? RECOMMENDATION_TOOL_CATALOG.filter((tool) => !primaryTools.some((primaryTool) => primaryTool.id === tool.id))
      : [];
    const scoredTools = [...primaryTools, ...fallbackTools]
      .map((tool) => this.scoreTool(tool, mode, latestMoodEntry, userPreferences, engagementMap[tool.id]))
      .sort((a, b) => b.score - a.score);

    return this.applyModeCategoryRules(scoredTools, mode, recommendationLimit)
      .sort((a, b) => b.score - a.score)
      .slice(0, recommendationLimit);
  }

  detectMode(latestMoodEntry: MoodEntry | null | undefined): RecommendationMode {
    if (!latestMoodEntry) {
      return 'support';
    }

    const labels = this.toNormalizedSet([...latestMoodEntry.emotions, ...latestMoodEntry.influences]);
    const hasSupportTrigger = this.hasAny(labels, SUPPORT_TRIGGER_LABELS);
    const hasGrowthTrigger = this.hasAny(labels, GROWTH_TRIGGER_LABELS);

    if (latestMoodEntry.moodLevel <= 4 || hasSupportTrigger) {
      return 'support';
    }

    if (latestMoodEntry.moodLevel >= 5 && latestMoodEntry.moodLevel <= 7 && hasGrowthTrigger) {
      return 'growth';
    }

    return latestMoodEntry.moodLevel >= 5 ? 'growth' : 'support';
  }

  private scoreTool(
    tool: RecommendationTool,
    mode: RecommendationMode,
    latestMoodEntry: MoodEntry | null | undefined,
    userPreferences: UserPreferences | null | undefined,
    engagement: ToolEngagement | undefined,
  ): RecommendationResult {
    const scoreBreakdown = {
      emotionMatch: this.weightedLabelMatch(
        latestMoodEntry?.emotions ?? [],
        tool.matchingEmotions,
        RECOMMENDATION_SCORE_WEIGHTS.emotionMatch,
      ),
      influenceMatch: this.weightedLabelMatch(
        latestMoodEntry?.influences ?? [],
        tool.matchingInfluences,
        RECOMMENDATION_SCORE_WEIGHTS.influenceMatch,
      ),
      preferenceMatch: this.preferenceScore(tool, userPreferences),
      moodMatch: this.moodScore(tool, latestMoodEntry),
      engagementScore: this.engagementScore(engagement),
    } satisfies RecommendationScoreBreakdown;

    const totalScore = Object.values(scoreBreakdown).reduce((total, score) => total + score, 0);

    return {
      tool,
      mode,
      score: this.roundScore(Math.max(0, totalScore)),
      scoreBreakdown,
    };
  }

  private weightedLabelMatch(
    selectedLabels: readonly string[],
    matchingLabels: readonly string[],
    weight: number,
  ): number {
    const selected = this.toNormalizedSet(selectedLabels);

    if (!selected.size || !matchingLabels.length) {
      return 0;
    }

    const matching = this.toNormalizedSet(matchingLabels);
    const matchCount = [...selected].filter((label) => matching.has(label)).length;

    return this.roundScore(weight * Math.min(matchCount / selected.size, 1));
  }

  private preferenceScore(
    tool: RecommendationTool,
    userPreferences: UserPreferences | null | undefined,
  ): number {
    if (!userPreferences) {
      return 0;
    }

    const avoidedToolIds = this.toNormalizedSet(userPreferences.avoidedToolIds ?? []);

    if (avoidedToolIds.has(this.normalizeLabel(tool.id))) {
      return -RECOMMENDATION_SCORE_WEIGHTS.preferenceMatch;
    }

    const preferredToolIds = this.toNormalizedSet(userPreferences.preferredToolIds ?? []);

    if (preferredToolIds.has(this.normalizeLabel(tool.id))) {
      return RECOMMENDATION_SCORE_WEIGHTS.preferenceMatch;
    }

    const preferenceSignals = [
      ...(userPreferences.preferredActivities ?? []),
      ...(userPreferences.preferredCategories ?? []),
      ...(userPreferences.preferredEmotions ?? []),
      ...(userPreferences.preferredInfluences ?? []),
    ];
    const toolSignals = [
      tool.category,
      ...tool.matchingPreferences,
      ...tool.matchingEmotions,
      ...tool.matchingInfluences,
    ];

    return this.weightedLabelMatch(
      preferenceSignals,
      toolSignals,
      RECOMMENDATION_SCORE_WEIGHTS.preferenceMatch,
    );
  }

  private moodScore(tool: RecommendationTool, latestMoodEntry: MoodEntry | null | undefined): number {
    if (!latestMoodEntry) {
      return 0;
    }

    const [minimumMood, maximumMood] = tool.supportedMoodRange;

    if (latestMoodEntry.moodLevel >= minimumMood && latestMoodEntry.moodLevel <= maximumMood) {
      return RECOMMENDATION_SCORE_WEIGHTS.moodMatch;
    }

    const distance = latestMoodEntry.moodLevel < minimumMood
      ? minimumMood - latestMoodEntry.moodLevel
      : latestMoodEntry.moodLevel - maximumMood;

    return distance === 1 ? RECOMMENDATION_SCORE_WEIGHTS.moodMatch / 2 : 0;
  }

  private engagementScore(engagement: ToolEngagement | undefined): number {
    if (!engagement || engagement.shownCount <= 0) {
      return 0;
    }

    const openedRatio = Math.min(Math.max(engagement.openedCount / engagement.shownCount, 0), 1);

    if (engagement.shownCount < 2) {
      return openedRatio > 0 ? RECOMMENDATION_SCORE_WEIGHTS.engagementScore / 2 : 0;
    }

    if (openedRatio >= 0.6) {
      return RECOMMENDATION_SCORE_WEIGHTS.engagementScore;
    }

    if (openedRatio >= 0.35) {
      return RECOMMENDATION_SCORE_WEIGHTS.engagementScore / 2;
    }

    if (openedRatio <= 0.1) {
      return -RECOMMENDATION_SCORE_WEIGHTS.engagementScore;
    }

    if (openedRatio <= 0.2) {
      return -RECOMMENDATION_SCORE_WEIGHTS.engagementScore / 2;
    }

    return 0;
  }

  private applyModeCategoryRules(
    scoredTools: readonly RecommendationResult[],
    mode: RecommendationMode,
    limit: number,
  ): RecommendationResult[] {
    const selected: RecommendationResult[] = [];
    const categoryTargets = this.categoryTargets(mode, limit);

    this.addTopCategoryTools(selected, scoredTools, 'therapeutic', categoryTargets.therapeutic);

    if (mode === 'support') {
      this.addTopCategoryTools(selected, scoredTools, 'personal', categoryTargets.personal);
    } else {
      this.addTopCategoryTools(selected, scoredTools, 'personal', categoryTargets.personal);
      this.addTopCategoryTools(selected, scoredTools, 'growth', categoryTargets.growth);
    }

    this.fillRemaining(selected, scoredTools, limit);

    return this.ensureCategoryDiversity(
      this.ensureCategoryPresent(selected, scoredTools, 'therapeutic', limit),
      scoredTools,
      limit,
    );
  }

  private categoryTargets(
    mode: RecommendationMode,
    limit: number,
  ): Record<RecommendationCategory, number> {
    const targets = MODE_CATEGORY_TARGETS[mode];
    const therapeutic = Math.max(1, Math.min(limit - 1, Math.round(limit * targets.therapeutic)));

    if (mode === 'support') {
      return {
        therapeutic,
        personal: limit - therapeutic,
        growth: 0,
      };
    }

    const nonTherapeuticCount = limit - therapeutic;
    const growth = Math.max(1, Math.round(nonTherapeuticCount * (targets.growth / (targets.personal + targets.growth))));

    return {
      therapeutic,
      personal: Math.max(0, nonTherapeuticCount - growth),
      growth,
    };
  }

  private addTopCategoryTools(
    selected: RecommendationResult[],
    scoredTools: readonly RecommendationResult[],
    category: RecommendationCategory,
    count: number,
  ): void {
    if (count <= 0) {
      return;
    }

    const candidates = scoredTools.filter((result) => result.tool.category === category);

    for (const candidate of candidates) {
      if (selected.length >= count && selected.filter((result) => result.tool.category === category).length >= count) {
        return;
      }

      if (!this.includesResult(selected, candidate)) {
        selected.push(candidate);
      }

      if (selected.filter((result) => result.tool.category === category).length >= count) {
        return;
      }
    }
  }

  private fillRemaining(
    selected: RecommendationResult[],
    scoredTools: readonly RecommendationResult[],
    limit: number,
  ): void {
    for (const result of scoredTools) {
      if (selected.length >= limit) {
        return;
      }

      if (!this.includesResult(selected, result)) {
        selected.push(result);
      }
    }
  }

  private ensureCategoryPresent(
    selected: readonly RecommendationResult[],
    scoredTools: readonly RecommendationResult[],
    category: RecommendationCategory,
    limit: number,
  ): RecommendationResult[] {
    if (selected.some((result) => result.tool.category === category)) {
      return [...selected];
    }

    const candidate = scoredTools.find(
      (result) => result.tool.category === category && !this.includesResult(selected, result),
    );

    if (!candidate) {
      return [...selected];
    }

    if (selected.length < limit) {
      return [...selected, candidate];
    }

    return this.replaceLowestScore(selected, candidate);
  }

  private ensureCategoryDiversity(
    selected: readonly RecommendationResult[],
    scoredTools: readonly RecommendationResult[],
    limit: number,
  ): RecommendationResult[] {
    const selectedCategories = new Set(selected.map((result) => result.tool.category));

    if (selectedCategories.size !== 1 || selected.length < 2) {
      return [...selected];
    }

    const onlyCategory = selected[0].tool.category;
    const candidate = scoredTools.find(
      (result) => result.tool.category !== onlyCategory && !this.includesResult(selected, result),
    );

    if (!candidate) {
      return [...selected];
    }

    return selected.length < limit
      ? [...selected, candidate]
      : this.replaceLowestScore(selected, candidate);
  }

  private replaceLowestScore(
    selected: readonly RecommendationResult[],
    replacement: RecommendationResult,
  ): RecommendationResult[] {
    const replacementIndex = selected.reduce((lowestIndex, result, index) => {
      return result.score < selected[lowestIndex].score ? index : lowestIndex;
    }, 0);

    return selected.map((result, index) => (index === replacementIndex ? replacement : result));
  }

  private normalizeLimit(limit: number): number {
    if (!Number.isFinite(limit)) {
      return DEFAULT_RECOMMENDATION_LIMIT;
    }

    return Math.min(Math.max(Math.round(limit), MIN_RECOMMENDATION_LIMIT), MAX_RECOMMENDATION_LIMIT);
  }

  private hasAny(labels: ReadonlySet<string>, targetLabels: ReadonlySet<string>): boolean {
    return [...targetLabels].some((label) => labels.has(label));
  }

  private includesResult(
    selected: readonly RecommendationResult[],
    candidate: RecommendationResult,
  ): boolean {
    return selected.some((result) => result.tool.id === candidate.tool.id);
  }

  private toNormalizedSet(labels: readonly string[]): ReadonlySet<string> {
    return new Set(labels.map((label) => this.normalizeLabel(label)).filter(Boolean));
  }

  private normalizeLabel(label: string): string {
    return label.trim().toLowerCase();
  }

  private roundScore(score: number): number {
    return Number(score.toFixed(2));
  }
}
