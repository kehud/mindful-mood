import { AsyncPipe, NgClass, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { createAnimation, IonicModule, NavController } from '@ionic/angular';
import type { Animation, AnimationBuilder } from '@ionic/angular';

import { InfluenceOption } from '../../../core/models/config-option.model';
import { ConfigService } from '../../../core/services/config.service';
import { LocalizationService } from '../../../core/services/localization.service';
import { MoodEntryService } from '../../../core/services/mood-entry.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ChipSelectorComponent, ChipSelectorOption } from '../../../shared/ui/chip-selector/chip-selector.component';
import { moodThemeClassForLevel } from '../check-in-mood-theme';

const SUCCESS_SCREEN_HOLD_MS = 2000;
const SUCCESS_ROUTE_FADE_MS = 340;

const INFLUENCE_ICONS: Record<string, string> = {
  Exercise: 'barbell-outline',
  Family: 'people-outline',
  Fitness: 'barbell-outline',
  Food: 'restaurant-outline',
  Friends: 'people-circle-outline',
  Health: 'heart-outline',
  Hobbies: 'color-palette-outline',
  Money: 'cash-outline',
  News: 'newspaper-outline',
  Other: 'ellipsis-horizontal-circle-outline',
  Partner: 'heart-circle-outline',
  Relationships: 'people-outline',
  School: 'school-outline',
  Sleep: 'moon-outline',
  'Social media': 'chatbubbles-outline',
  Travel: 'airplane-outline',
  Weather: 'partly-sunny-outline',
  Work: 'briefcase-outline',
};

@Component({
  selector: 'app-influences-journal',
  standalone: true,
  imports: [AsyncPipe, ChipSelectorComponent, IonicModule, NgClass, NgIf, RouterLink, TranslatePipe],
  templateUrl: './influences-journal.page.html',
  styleUrls: ['./influences-journal.page.scss'],
})
export class InfluencesJournalPage {
  private readonly configService = inject(ConfigService);
  private readonly localization = inject(LocalizationService);
  private readonly moodEntryService = inject(MoodEntryService);
  private readonly navController = inject(NavController);
  private readonly successRouteFadeAnimation: AnimationBuilder = (_baseEl, opts) => {
    const routeAnimation = createAnimation()
      .duration(SUCCESS_ROUTE_FADE_MS)
      .easing('cubic-bezier(0.22, 1, 0.36, 1)');
    const pageAnimations: Animation[] = [];
    const enteringEl = opts?.enteringEl as HTMLElement | undefined;
    const leavingEl = opts?.leavingEl as HTMLElement | undefined;

    if (enteringEl) {
      pageAnimations.push(
        createAnimation()
          .addElement(enteringEl)
          .beforeRemoveClass('ion-page-invisible')
          .fromTo('opacity', '0.01', '1'),
      );
    }

    if (leavingEl) {
      pageAnimations.push(
        createAnimation()
          .addElement(leavingEl)
          .fromTo('opacity', '1', '0'),
      );
    }

    return routeAnimation.addAnimation(pageAnimations);
  };

  readonly influenceOptionsState$ = this.configService.influenceOptionsState$;
  readonly moodOptionsState$ = this.configService.moodOptionsState$;
  readonly currentLanguage = this.localization.currentLanguage;
  selectedInfluences = this.moodEntryService.draftSnapshot.influences;
  journalNote = this.moodEntryService.draftSnapshot.journalNote;
  showAllInfluences = false;
  isSaving = false;
  showSuccess = false;
  isSuccessLeaving = false;
  errorMessage = '';

  get selectedMoodValue(): number {
    return this.moodEntryService.draftSnapshot.moodLevel;
  }

  optionItems(options: readonly InfluenceOption[], _language: string): ChipSelectorOption[] {
    return options.map((option) => ({
      value: option.label,
      label: this.localization.configLabel(option),
      icon: INFLUENCE_ICONS[option.label] ?? 'ellipse-outline',
    }));
  }

  moodThemeClass(level: number): string {
    return moodThemeClassForLevel(level);
  }

  toggleShowAllInfluences(event: Event): void {
    event.preventDefault();
    this.showAllInfluences = !this.showAllInfluences;
  }

  showAllToggleLabel(expanded: boolean): string {
    return this.currentLanguage() === 'he'
      ? expanded ? 'הצג פחות' : 'הצג עוד'
      : expanded ? 'Show Less' : 'Show More';
  }

  async save(): Promise<void> {
    if (this.isSaving) {
      return;
    }

    this.errorMessage = '';
    this.isSaving = true;

    this.moodEntryService.updateDraft({
      influences: this.selectedInfluences,
      journalNote: this.journalNote,
    });

    try {
      await this.moodEntryService.saveDraft();
      this.showSuccess = true;
      this.isSuccessLeaving = false;
      await this.pauseForSuccessFeedback();
      await this.navController.navigateRoot('/tabs/history', {
        replaceUrl: true,
        animated: true,
        animationDirection: 'forward',
        animation: this.successRouteFadeAnimation,
      });
    } catch (error) {
      this.errorMessage = this.moodEntryService.getErrorMessage(error);
      this.showSuccess = false;
      this.isSuccessLeaving = false;
    } finally {
      this.isSaving = false;
    }
  }

  private async pauseForSuccessFeedback(): Promise<void> {
    await this.delay(SUCCESS_SCREEN_HOLD_MS);
    this.isSuccessLeaving = true;
  }

  private delay(durationMs: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, durationMs));
  }
}
