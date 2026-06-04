import { AsyncPipe, NgIf } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { map, shareReplay, startWith } from 'rxjs';

import { DailyReflectionText, ReflectionTemplate } from '../../core/models/reflection-template.model';
import { AuthService } from '../../core/services/auth.service';
import { AppLanguage, LocalizationService } from '../../core/services/localization.service';
import { ReflectionTemplateService } from '../../core/services/reflection-template.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

interface HomeUserView {
  readonly displayName: string | null | undefined;
  readonly resolved: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [AsyncPipe, IonicModule, NgIf, RouterLink, TranslatePipe],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  private readonly authService = inject(AuthService);
  private readonly localization = inject(LocalizationService);
  private readonly reflectionTemplateService = inject(ReflectionTemplateService);
  private readonly reflectionTemplatesState = toSignal(this.reflectionTemplateService.activeTemplatesState$, {
    initialValue: {
      templates: [] as readonly ReflectionTemplate[],
      loading: true,
    },
  });

  readonly currentUserView$ = this.authService.currentUser$.pipe(
    map((user): HomeUserView => ({ displayName: user?.displayName, resolved: true })),
    startWith({ displayName: undefined, resolved: false }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  readonly isDailyReflectionLoading = computed(() => this.reflectionTemplatesState().loading);
  readonly dailyReflection = computed<DailyReflectionText>(() => {
    const language = this.localization.currentLanguage();
    const template = this.selectDailyTemplate(this.reflectionTemplatesState().templates);

    return template ? this.toDailyReflection(template, language) : this.fallbackReflection();
  });

  get greetingTranslationKey(): string {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return 'home.greeting.morning';
    }

    if (hour >= 12 && hour < 17) {
      return 'home.greeting.afternoon';
    }

    if (hour >= 17 && hour < 21) {
      return 'home.greeting.evening';
    }

    return 'home.greeting.night';
  }

  nameLead(displayName: string | null | undefined): string {
    return this.normalizedName(displayName).slice(0, 1);
  }

  nameRest(displayName: string | null | undefined): string {
    return this.normalizedName(displayName).slice(1);
  }

  private normalizedName(displayName: string | null | undefined): string {
    return displayName?.trim() ?? '';
  }

  private selectDailyTemplate(templates: readonly ReflectionTemplate[]): ReflectionTemplate | null {
    if (!templates.length) {
      return null;
    }

    const templateKey = templates
      .map((template) => `${template.id ?? template.label}:${template.order}`)
      .join('|');
    const seed = this.hashString(`${this.toDateKey(new Date())}:${templateKey}`);

    return templates[seed % templates.length] ?? null;
  }

  private toDailyReflection(template: ReflectionTemplate, language: AppLanguage): DailyReflectionText {
    const translation = template.translations[language] ?? template.translations.en;

    return {
      title: translation.title,
      body: translation.body,
    };
  }

  private fallbackReflection(): DailyReflectionText {
    return {
      title: this.localization.translate('home.reflectionTitle'),
      body: this.localization.translate('home.reflectionSubtitle'),
    };
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private hashString(value: string): number {
    let hash = 0;

    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    }

    return hash;
  }
}
