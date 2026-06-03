import { AsyncPipe, NgClass, NgIf } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { createAnimation, IonicModule, NavController } from '@ionic/angular';
import type { Animation, AnimationBuilder } from '@ionic/angular';

import { influenceIconForLabel } from '../../../core/config-option-icons';
import { InfluenceOption } from '../../../core/models/config-option.model';
import { ConfigService } from '../../../core/services/config.service';
import { LocalizationService } from '../../../core/services/localization.service';
import { MoodEntryService } from '../../../core/services/mood-entry.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ChipSelectorComponent, ChipSelectorOption } from '../../../shared/ui/chip-selector/chip-selector.component';
import { moodThemeClassForLevel } from '../check-in-mood-theme';

const SUCCESS_SCREEN_HOLD_MS = 2000;
const SUCCESS_ROUTE_FADE_MS = 340;

@Component({
  selector: 'app-influences-journal',
  standalone: true,
  imports: [AsyncPipe, ChipSelectorComponent, IonicModule, NgClass, NgIf, RouterLink, TranslatePipe],
  templateUrl: './influences-journal.page.html',
  styleUrls: ['./influences-journal.page.scss'],
})
export class InfluencesJournalPage implements OnDestroy {
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
  private successNavigationTimer?: ReturnType<typeof setTimeout>;
  private isNavigatingAfterSuccess = false;

  get selectedMoodValue(): number {
    return this.moodEntryService.draftSnapshot.moodLevel;
  }

  optionItems(options: readonly InfluenceOption[], _language: string): ChipSelectorOption[] {
    return options.map((option) => ({
      value: option.label,
      label: this.localization.configLabel(option),
      icon: influenceIconForLabel(option.label),
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
    if (this.isSaving || this.showSuccess || this.isNavigatingAfterSuccess) {
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
      this.scheduleSuccessNavigation();
    } catch (error) {
      this.errorMessage = this.moodEntryService.getErrorMessage(error);
      this.clearSuccessNavigationTimer();
      this.showSuccess = false;
      this.isSuccessLeaving = false;
      this.isNavigatingAfterSuccess = false;
    } finally {
      this.isSaving = false;
    }
  }

  ngOnDestroy(): void {
    this.clearSuccessNavigationTimer();
  }

  private scheduleSuccessNavigation(): void {
    if (this.successNavigationTimer || this.isNavigatingAfterSuccess) {
      return;
    }

    this.successNavigationTimer = setTimeout(() => {
      this.successNavigationTimer = undefined;
      void this.navigateToToolsAfterSuccess().catch(() => {
        this.isNavigatingAfterSuccess = false;
        this.isSuccessLeaving = false;
      });
    }, SUCCESS_SCREEN_HOLD_MS);
  }

  private async navigateToToolsAfterSuccess(): Promise<void> {
    if (this.isNavigatingAfterSuccess) {
      return;
    }

    this.isNavigatingAfterSuccess = true;
    this.isSuccessLeaving = true;

    await this.navController.navigateRoot('/tabs/tools', {
      replaceUrl: true,
      animated: true,
      animationDirection: 'forward',
      animation: this.successRouteFadeAnimation,
    });
  }

  private clearSuccessNavigationTimer(): void {
    if (!this.successNavigationTimer) {
      return;
    }

    clearTimeout(this.successNavigationTimer);
    this.successNavigationTimer = undefined;
  }
}
