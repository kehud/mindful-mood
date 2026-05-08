import { DOCUMENT } from '@angular/common';
import { Injectable, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeOption {
  value: ThemePreference;
  label: string;
  icon: string;
}

const THEME_STORAGE_KEY = 'mindful-mood-theme';
const THEME_OPTIONS: readonly ThemeOption[] = [
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
];

@Injectable({
  providedIn: 'root',
})
export class ThemeService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly systemPreference = this.createSystemPreference();
  private readonly preferenceSubject = new BehaviorSubject<ThemePreference>('system');
  private readonly resolvedThemeSubject = new BehaviorSubject<ResolvedTheme>('light');
  private readonly onSystemPreferenceChange = (): void => {
    if (this.preferenceSubject.value === 'system') {
      this.applyTheme('system');
    }
  };

  readonly themeOptions = THEME_OPTIONS;
  readonly preference$ = this.preferenceSubject.asObservable();
  readonly resolvedTheme$ = this.resolvedThemeSubject.asObservable();

  constructor() {
    const preference = this.readStoredPreference();

    this.preferenceSubject.next(preference);
    this.applyTheme(preference);
    this.listenToSystemPreference();
  }

  ngOnDestroy(): void {
    if (!this.systemPreference) {
      return;
    }

    this.systemPreference.removeEventListener('change', this.onSystemPreferenceChange);
  }

  setPreference(preference: ThemePreference): void {
    this.preferenceSubject.next(preference);
    this.storePreference(preference);
    this.applyTheme(preference);
  }

  isThemePreference(value: unknown): value is ThemePreference {
    return value === 'system' || value === 'light' || value === 'dark';
  }

  private createSystemPreference(): MediaQueryList | null {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
  }

  private listenToSystemPreference(): void {
    if (!this.systemPreference) {
      return;
    }

    this.systemPreference.addEventListener('change', this.onSystemPreferenceChange);
  }

  private readStoredPreference(): ThemePreference {
    const storedPreference = this.storage?.getItem(THEME_STORAGE_KEY);

    return this.isThemePreference(storedPreference) ? storedPreference : 'system';
  }

  private storePreference(preference: ThemePreference): void {
    try {
      this.storage?.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // Theme still applies for the current session when storage is unavailable.
    }
  }

  private applyTheme(preference: ThemePreference): void {
    const resolvedTheme = this.resolveTheme(preference);
    const isDark = resolvedTheme === 'dark';

    this.document.documentElement.classList.toggle('ion-palette-dark', isDark);
    this.document.documentElement.style.colorScheme = resolvedTheme;
    this.resolvedThemeSubject.next(resolvedTheme);
  }

  private resolveTheme(preference: ThemePreference): ResolvedTheme {
    if (preference === 'system') {
      return this.systemPreference?.matches ? 'dark' : 'light';
    }

    return preference;
  }

  private get storage(): Storage | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }
}
