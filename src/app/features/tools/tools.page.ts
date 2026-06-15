import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { IonicModule } from '@ionic/angular';
import { catchError, combineLatest, from, of, shareReplay, startWith, switchMap, tap } from 'rxjs';

import { MoodEntry } from '../../core/models/mood-entry.model';
import {
  RecommendationCategory,
  RecommendationLocalizedText,
  RecommendationResult,
  UserPreferences,
} from '../../core/models/recommendation.model';
import { AuthService } from '../../core/services/auth.service';
import { EngagementService } from '../../core/services/engagement.service';
import { LocalizationService } from '../../core/services/localization.service';
import { MoodEntryService } from '../../core/services/mood-entry.service';
import { RecommendationService } from '../../core/services/recommendation.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

type ToolTone = 'teal' | 'peach' | 'violet' | 'plum';

interface RecommendationDisplayText {
  readonly title: RecommendationLocalizedText;
  readonly description: RecommendationLocalizedText;
}

const RECOMMENDATION_DISPLAY_TEXT: Record<string, RecommendationDisplayText> = {
  breathing: {
    title: { en: 'Breathing', he: 'נשימה' },
    description: {
      en: 'A short breathing reset for calming the body.',
      he: 'איפוס נשימה קצר להרגעת הגוף.',
    },
  },
  grounding: {
    title: { en: 'Grounding', he: 'קרקוע' },
    description: {
      en: 'A senses-based grounding exercise for anxious moments.',
      he: 'תרגול קרקוע דרך החושים לרגעי חרדה או לחץ.',
    },
  },
  meditation: {
    title: { en: 'Meditation', he: 'מדיטציה' },
    description: {
      en: 'A quiet practice for settling attention.',
      he: 'תרגול שקט לייצוב הקשב.',
    },
  },
  'guided-journaling': {
    title: { en: 'Guided Journaling', he: 'כתיבה מונחית' },
    description: {
      en: 'Prompts for naming what is happening now.',
      he: 'שאלות כתיבה לזיהוי מה קורה עכשיו.',
    },
  },
  gratitude: {
    title: { en: 'Gratitude', he: 'הכרת תודה' },
    description: {
      en: 'Notice small steady things from the day.',
      he: 'לשים לב לדברים קטנים שמייצבים היום.',
    },
  },
  'reflection-prompts': {
    title: { en: 'Reflection Prompts', he: 'שאלות לרפלקציה' },
    description: {
      en: 'A gentle prompt for exploring the moment.',
      he: 'שאלה עדינה לחקירת הרגע.',
    },
  },
  'muscle-relaxation': {
    title: { en: 'Muscle Relaxation', he: 'הרפיית שרירים' },
    description: {
      en: 'Release physical tension step by step.',
      he: 'שחרור מתח גופני צעד אחר צעד.',
    },
  },
  music: {
    title: { en: 'Music', he: 'מוזיקה' },
    description: {
      en: 'Listen to music that gently shifts the mood.',
      he: 'להקשיב למוזיקה שמזיזה בעדינות את מצב הרוח.',
    },
  },
  walking: {
    title: { en: 'Walking', he: 'הליכה' },
    description: {
      en: 'Take a short walk for movement and space.',
      he: 'הליכה קצרה לתנועה ומרחב.',
    },
  },
  nature: {
    title: { en: 'Nature', he: 'טבע' },
    description: {
      en: 'Spend a few minutes with fresh air or sky.',
      he: 'כמה דקות עם אוויר פתוח או שמיים.',
    },
  },
  photography: {
    title: { en: 'Photography', he: 'צילום' },
    description: {
      en: 'Capture one image that reflects the moment.',
      he: 'לצלם תמונה אחת שמשקפת את הרגע.',
    },
  },
  reading: {
    title: { en: 'Reading', he: 'קריאה' },
    description: {
      en: 'Read something gentle for a short reset.',
      he: 'לקרוא משהו עדין לאיפוס קצר.',
    },
  },
  cooking: {
    title: { en: 'Cooking', he: 'בישול' },
    description: {
      en: 'Prepare something simple and nourishing.',
      he: 'להכין משהו פשוט ומזין.',
    },
  },
  friends: {
    title: { en: 'Friends', he: 'חברים' },
    description: {
      en: 'Reach out for a small point of connection.',
      he: 'לפנות לרגע קטן של חיבור.',
    },
  },
  family: {
    title: { en: 'Family', he: 'משפחה' },
    description: {
      en: 'Connect in a way that feels supportive today.',
      he: 'להתחבר בדרך שתומכת היום.',
    },
  },
  sports: {
    title: { en: 'Sports', he: 'ספורט' },
    description: {
      en: 'Use movement as an energizing outlet.',
      he: 'להשתמש בתנועה כפורקן שנותן אנרגיה.',
    },
  },
  gaming: {
    title: { en: 'Gaming', he: 'משחקים' },
    description: {
      en: 'Play something light as a contained break.',
      he: 'לשחק משהו קליל כהפסקה תחומה.',
    },
  },
  'learn-something-new': {
    title: { en: 'Learn Something New', he: 'ללמוד משהו חדש' },
    description: {
      en: 'Choose a small topic that sparks curiosity.',
      he: 'לבחור נושא קטן שמעורר סקרנות.',
    },
  },
  'personal-goals': {
    title: { en: 'Personal Goals', he: 'מטרות אישיות' },
    description: {
      en: 'Choose one small next step.',
      he: 'לבחור צעד קטן אחד להמשך.',
    },
  },
  habits: {
    title: { en: 'Habits', he: 'הרגלים' },
    description: {
      en: 'Pick one tiny repeatable action.',
      he: 'לבחור פעולה קטנה שאפשר לחזור עליה.',
    },
  },
  hobbies: {
    title: { en: 'Hobbies', he: 'תחביבים' },
    description: {
      en: 'Spend a little time with something enjoyable.',
      he: 'להקדיש מעט זמן למשהו מהנה.',
    },
  },
  creativity: {
    title: { en: 'Creativity', he: 'יצירתיות' },
    description: {
      en: 'Make or sketch something small.',
      he: 'ליצור או לשרטט משהו קטן.',
    },
  },
  'personal-development': {
    title: { en: 'Personal Development', he: 'התפתחות אישית' },
    description: {
      en: 'Reflect on a strength or next step.',
      he: 'להתבונן בחוזקה או בצעד הבא.',
    },
  },
};

interface ToolCard {
  readonly id: string;
  readonly titleKey: string;
  readonly subtitleKey: string;
  readonly icon: string;
  readonly tone: ToolTone;
  readonly category: RecommendationCategory;
}

// TEMP scroll test items.
const TEMP_SCROLL_TEST_TOOLS: readonly ToolCard[] = [
  {
    id: 'temp-breathing-scroll-test',
    titleKey: 'tools.breathe',
    subtitleKey: 'tools.breatheSubtitle',
    icon: 'radio-button-on-outline',
    tone: 'teal',
    category: 'therapeutic',
  },
  {
    id: 'temp-reflection-scroll-test',
    titleKey: 'tools.reflect',
    subtitleKey: 'tools.reflectSubtitle',
    icon: 'pencil-outline',
    tone: 'peach',
    category: 'therapeutic',
  },
  {
    id: 'temp-grounding-scroll-test',
    titleKey: 'tools.ground',
    subtitleKey: 'tools.groundSubtitle',
    icon: 'leaf-outline',
    tone: 'violet',
    category: 'therapeutic',
  },
  {
    id: 'temp-sleep-scroll-test',
    titleKey: 'tools.sleep',
    subtitleKey: 'tools.sleepSubtitle',
    icon: 'moon-outline',
    tone: 'plum',
    category: 'therapeutic',
  },
  {
    id: 'temp-breathing-scroll-test-2',
    titleKey: 'tools.breathe',
    subtitleKey: 'tools.breatheSubtitle',
    icon: 'radio-button-on-outline',
    tone: 'teal',
    category: 'therapeutic',
  },
  {
    id: 'temp-reflection-scroll-test-2',
    titleKey: 'tools.reflect',
    subtitleKey: 'tools.reflectSubtitle',
    icon: 'pencil-outline',
    tone: 'peach',
    category: 'therapeutic',
  },
  {
    id: 'temp-grounding-scroll-test-2',
    titleKey: 'tools.ground',
    subtitleKey: 'tools.groundSubtitle',
    icon: 'leaf-outline',
    tone: 'violet',
    category: 'therapeutic',
  },
  {
    id: 'temp-sleep-scroll-test-2',
    titleKey: 'tools.sleep',
    subtitleKey: 'tools.sleepSubtitle',
    icon: 'moon-outline',
    tone: 'plum',
    category: 'therapeutic',
  },
];

interface RecommendationCard {
  readonly id: string;
  readonly title: string;
  readonly titleKey?: string;
  readonly titleTranslations?: RecommendationLocalizedText;
  readonly description: string;
  readonly descriptionKey?: string;
  readonly descriptionTranslations?: RecommendationLocalizedText;
  readonly icon: string;
  readonly tone: ToolTone;
  readonly shownKey: string;
  readonly engagementEnabled: boolean;
}

@Component({
  selector: 'app-tools',
  standalone: true,
  imports: [AsyncPipe, IonicModule, NgFor, NgIf, TranslatePipe],
  templateUrl: './tools.page.html',
  styleUrls: ['./tools.page.scss'],
})
export class ToolsPage {
  private readonly authService = inject(AuthService);
  private readonly engagementService = inject(EngagementService);
  private readonly firestore = inject(Firestore);
  private readonly localization = inject(LocalizationService);
  private readonly moodEntryService = inject(MoodEntryService);
  private readonly recommendationService = inject(RecommendationService);
  // TEMP: UI testing limit = 5. Future recommendation count should be dynamic.
  private readonly recommendationLimit = 5;
  private readonly shownRecommendationKeys = new Set<string>();

  readonly tools: readonly ToolCard[] = [
    {
      id: 'breathing',
      titleKey: 'tools.breathe',
      subtitleKey: 'tools.breatheSubtitle',
      icon: 'radio-button-on-outline',
      tone: 'teal',
      category: 'therapeutic',
    },
    {
      id: 'reflection-prompts',
      titleKey: 'tools.reflect',
      subtitleKey: 'tools.reflectSubtitle',
      icon: 'pencil-outline',
      tone: 'peach',
      category: 'therapeutic',
    },
    {
      id: 'grounding',
      titleKey: 'tools.ground',
      subtitleKey: 'tools.groundSubtitle',
      icon: 'leaf-outline',
      tone: 'violet',
      category: 'therapeutic',
    },
    {
      id: 'meditation',
      titleKey: 'tools.sleep',
      subtitleKey: 'tools.sleepSubtitle',
      icon: 'moon-outline',
      tone: 'plum',
      category: 'therapeutic',
    },
  ];

  readonly allTools: readonly ToolCard[] = [...this.tools, ...TEMP_SCROLL_TEST_TOOLS];

  readonly recommendedTools$ = combineLatest([
    this.authService.currentUser$,
    this.moodEntryService.entries$,
  ]).pipe(
    switchMap(([user, entries]) => {
      const latestMoodEntry = entries[0] ?? null;

      if (!user || !latestMoodEntry) {
        return of(this.createFallbackRecommendationCards(user?.uid ?? 'preview', 'default', Boolean(user)));
      }

      return from(this.loadPersonalizedRecommendationCards(user.uid, latestMoodEntry)).pipe(
        catchError(() => of(this.createFallbackRecommendationCards(user.uid, latestMoodEntry.id))),
      );
    }),
    startWith(this.createFallbackRecommendationCards('preview', 'initial', false)),
    tap((recommendations) => this.trackShownRecommendations(recommendations)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  trackTool(_index: number, tool: ToolCard): string {
    return tool.id;
  }

  trackRecommendation(_index: number, tool: RecommendationCard): string {
    return tool.id;
  }

  recommendationTitle(tool: RecommendationCard): string {
    const displayText = RECOMMENDATION_DISPLAY_TEXT[tool.id];

    if (displayText) {
      return this.localizedRecommendationText(displayText.title, tool.title);
    }

    return tool.titleKey
      ? this.localization.translate(tool.titleKey)
      : this.localizedRecommendationText(tool.titleTranslations, tool.title);
  }

  recommendationSummary(tool: RecommendationCard): string {
    const displayText = RECOMMENDATION_DISPLAY_TEXT[tool.id];

    if (displayText) {
      return this.localizedRecommendationText(displayText.description, tool.description);
    }

    return tool.descriptionKey
      ? this.localization.translate(tool.descriptionKey)
      : this.localizedRecommendationText(tool.descriptionTranslations, tool.description);
  }

  onRecommendationSelected(tool: RecommendationCard): void {
    if (!tool.engagementEnabled) {
      return;
    }

    void this.engagementService.trackToolOpened(tool.id).catch(() => undefined);
  }

  private async loadPersonalizedRecommendationCards(
    userId: string,
    latestMoodEntry: MoodEntry,
  ): Promise<RecommendationCard[]> {
    const [userPreferences, engagementMap] = await Promise.all([
      this.loadUserPreferences(userId).catch(() => this.emptyUserPreferences(userId)),
      this.engagementService.loadToolEngagementMap(userId).catch(() => ({})),
    ]);
    const recommendations = this.recommendationService.getRecommendations(
      latestMoodEntry,
      userPreferences,
      engagementMap,
      this.recommendationLimit,
    );

    return recommendations.length
      ? recommendations.map((recommendation) => this.toRecommendationCard(recommendation, userId, latestMoodEntry.id))
      : this.createFallbackRecommendationCards(userId, latestMoodEntry.id);
  }

  private async loadUserPreferences(userId: string): Promise<UserPreferences> {
    const userSnapshot = await getDoc(doc(this.firestore, `users/${userId}`));

    if (!userSnapshot.exists()) {
      return this.emptyUserPreferences(userId);
    }

    const data = userSnapshot.data();

    return this.toUserPreferences(data['recommendationPreferences'], userId) ??
      this.toUserPreferences(data['preferences'], userId) ??
      this.toUserPreferences(data, userId) ??
      this.emptyUserPreferences(userId);
  }

  private toRecommendationCard(
    recommendation: RecommendationResult,
    userId: string,
    latestMoodEntryId: string,
  ): RecommendationCard {
    const { tool } = recommendation;

    return {
      id: tool.id,
      title: tool.title,
      titleTranslations: tool.titleTranslations,
      description: tool.description,
      descriptionTranslations: tool.descriptionTranslations,
      icon: tool.icon,
      tone: this.toneForCategory(tool.category),
      shownKey: `${userId}:${latestMoodEntryId}:${tool.id}`,
      engagementEnabled: true,
    };
  }

  private createFallbackRecommendationCards(
    userId: string,
    contextId: string,
    engagementEnabled = true,
  ): RecommendationCard[] {
    return this.tools.slice(0, this.recommendationLimit).map((tool) => ({
      id: tool.id,
      title: '',
      titleKey: tool.titleKey,
      description: '',
      descriptionKey: tool.subtitleKey,
      icon: tool.icon,
      tone: tool.tone,
      shownKey: `${userId}:${contextId}:${tool.id}`,
      engagementEnabled,
    }));
  }

  private trackShownRecommendations(recommendations: readonly RecommendationCard[]): void {
    recommendations.forEach((recommendation) => {
      if (!recommendation.engagementEnabled) {
        return;
      }

      if (this.shownRecommendationKeys.has(recommendation.shownKey)) {
        return;
      }

      this.shownRecommendationKeys.add(recommendation.shownKey);
      void this.engagementService.trackToolShown(recommendation.id).catch(() => undefined);
    });
  }

  private toUserPreferences(value: unknown, userId: string): UserPreferences | null {
    if (!isRecord(value)) {
      return null;
    }

    return {
      userId: readString(value, 'userId') ?? userId,
      preferredToolIds: readStringArray(value, 'preferredToolIds') ?? [],
      preferredCategories: readRecommendationCategories(value, 'preferredCategories') ?? [],
      preferredEmotions: readStringArray(value, 'preferredEmotions') ?? [],
      preferredInfluences: readStringArray(value, 'preferredInfluences') ?? [],
      preferredActivities: readStringArray(value, 'preferredActivities') ?? [],
      avoidedToolIds: readStringArray(value, 'avoidedToolIds') ?? [],
      ...(readString(value, 'updatedAt') ? { updatedAt: readString(value, 'updatedAt') ?? undefined } : {}),
    };
  }

  private emptyUserPreferences(userId: string): UserPreferences {
    return {
      userId,
      preferredToolIds: [],
      preferredCategories: [],
      preferredEmotions: [],
      preferredInfluences: [],
      preferredActivities: [],
      avoidedToolIds: [],
    };
  }

  private toneForCategory(category: RecommendationCategory): ToolTone {
    if (category === 'personal') {
      return 'peach';
    }

    if (category === 'growth') {
      return 'violet';
    }

    return 'teal';
  }

  private localizedRecommendationText(
    translations: RecommendationLocalizedText | undefined,
    fallback: string,
  ): string {
    if (!translations) {
      return fallback.trim();
    }

    const language = this.localization.currentLanguage();
    const translatedText = this.localizedTextForLanguage(translations, language);

    return translatedText || translations.en.trim() || fallback.trim();
  }

  private localizedTextForLanguage(
    translations: RecommendationLocalizedText,
    language: 'en' | 'he',
  ): string {
    if (language === 'he') {
      return translations.he?.trim() ?? '';
    }

    return translations.en.trim();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];

  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readStringArray(data: Record<string, unknown>, key: string): string[] | null {
  const value = data[key];

  if (value === undefined) {
    return null;
  }

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    : null;
}

function readRecommendationCategories(
  data: Record<string, unknown>,
  key: string,
): RecommendationCategory[] | null {
  const values = readStringArray(data, key);

  if (!values) {
    return null;
  }

  return values.filter((value): value is RecommendationCategory =>
    value === 'therapeutic' || value === 'personal' || value === 'growth',
  );
}
