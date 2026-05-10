import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { ConfigTranslations } from '../models/config-option.model';
import { TRANSLATIONS, TranslationKey } from './localization.translations';

export type AppLanguage = 'en' | 'he';
export type AppDirection = 'ltr' | 'rtl';

export interface AppLanguageOption {
  readonly code: AppLanguage;
  readonly label: string;
  readonly nativeLabel: string;
  readonly direction: AppDirection;
}

export interface LocalizedConfigLabel {
  readonly label: string;
  readonly translations?: ConfigTranslations;
}

const LANGUAGE_STORAGE_KEY = 'mindful-mood-language';
const DEFAULT_LANGUAGE: AppLanguage = 'en';

const LANGUAGE_OPTIONS: readonly AppLanguageOption[] = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    direction: 'ltr',
  },
  {
    code: 'he',
    label: 'Hebrew',
    nativeLabel: 'עברית',
    direction: 'rtl',
  },
];

const LANGUAGE_DIRECTIONS: Record<AppLanguage, AppDirection> = {
  en: 'ltr',
  he: 'rtl',
};

@Injectable({
  providedIn: 'root',
})
export class LocalizationService {
  private readonly document = inject(DOCUMENT);
  private readonly language = signal<AppLanguage>(this.getInitialLanguage());

  readonly availableLanguages = LANGUAGE_OPTIONS;
  readonly currentLanguage = this.language.asReadonly();
  readonly direction = computed(() => LANGUAGE_DIRECTIONS[this.currentLanguage()]);
  readonly isRtl = computed(() => this.direction() === 'rtl');

  constructor() {
    effect(() => {
      const language = this.currentLanguage();
      const direction = this.direction();
      const root = this.document.documentElement;

      root.lang = language;
      root.dir = direction;
      root.classList.toggle('app-rtl', direction === 'rtl');
      root.classList.toggle('app-ltr', direction === 'ltr');
      this.document.body?.setAttribute('dir', direction);
      this.persistLanguage(language);
    });
  }

  setLanguage(language: AppLanguage): void {
    if (!this.isSupportedLanguage(language)) {
      return;
    }

    this.language.set(language);
  }

  toggleLanguage(): void {
    this.setLanguage(this.currentLanguage() === 'he' ? 'en' : 'he');
  }

  translate(key: TranslationKey | string, params?: Record<string, string | number>): string {
    const dictionary = TRANSLATIONS[this.currentLanguage()];
    const fallbackDictionary = TRANSLATIONS.en;
    const value = dictionary[key as TranslationKey] ?? fallbackDictionary[key as TranslationKey] ?? key;

    return this.interpolate(value, params);
  }

  configLabel(option: LocalizedConfigLabel | string | null | undefined): string {
    if (!option) {
      return '';
    }

    if (typeof option === 'string') {
      return option;
    }

    const translatedLabel = option.translations?.[this.currentLanguage()];

    return translatedLabel?.trim() || option.label;
  }

  configLabelForValue(
    value: string,
    options: readonly LocalizedConfigLabel[] | null | undefined,
  ): string {
    const option = options?.find((item) => item.label === value);

    return this.configLabel(option ?? value);
  }

  private getInitialLanguage(): AppLanguage {
    const storedLanguage = this.readStoredLanguage();

    if (storedLanguage) {
      return storedLanguage;
    }

    return this.getBrowserLanguage() ?? DEFAULT_LANGUAGE;
  }

  private readStoredLanguage(): AppLanguage | null {
    try {
      const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

      return this.isSupportedLanguage(storedLanguage) ? storedLanguage : null;
    } catch {
      return null;
    }
  }

  private getBrowserLanguage(): AppLanguage | null {
    try {
      const browserLanguage = navigator.language.toLowerCase();

      return browserLanguage.startsWith('he') ? 'he' : null;
    } catch {
      return null;
    }
  }

  private persistLanguage(language: AppLanguage): void {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Language still applies for this session when storage is unavailable.
    }
  }

  private isSupportedLanguage(language: string | null): language is AppLanguage {
    return language === 'en' || language === 'he';
  }

  private interpolate(value: string, params?: Record<string, string | number>): string {
    if (!params) {
      return value;
    }

    return Object.entries(params).reduce(
      (translation, [name, replacement]) =>
        translation.replace(new RegExp(`{{\\s*${name}\\s*}}`, 'g'), String(replacement)),
      value,
    );
  }
}
