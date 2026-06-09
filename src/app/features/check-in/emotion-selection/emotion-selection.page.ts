import { AsyncPipe, NgClass, NgIf } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { emotionIconForLabel } from '../../../core/config-option-icons';
import { EmotionOption } from '../../../core/models/config-option.model';
import { ConfigService } from '../../../core/services/config.service';
import { LocalizationService } from '../../../core/services/localization.service';
import { MoodEntryService } from '../../../core/services/mood-entry.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ChipSelectorComponent, ChipSelectorOption } from '../../../shared/ui/chip-selector/chip-selector.component';
import { moodThemeClassForLevel } from '../check-in-mood-theme';

const COMPACT_EMOTION_CHIP_COUNT = 4;
const PHONE_EMOTION_CHIP_COUNT = 6;
const TALL_EMOTION_CHIP_COUNT = 8;
const COMPACT_VIEWPORT_HEIGHT = 740;
const PHONE_VIEWPORT_HEIGHT = 980;

@Component({
  selector: 'app-emotion-selection',
  standalone: true,
  imports: [AsyncPipe, ChipSelectorComponent, IonicModule, NgClass, NgIf, RouterLink, TranslatePipe],
  templateUrl: './emotion-selection.page.html',
  styleUrls: ['./emotion-selection.page.scss'],
})
export class EmotionSelectionPage {
  private readonly configService = inject(ConfigService);
  private readonly localization = inject(LocalizationService);
  private readonly moodEntryService = inject(MoodEntryService);
  private readonly router = inject(Router);

  readonly emotionOptionsState$ = this.configService.emotionOptionsState$;
  readonly moodOptionsState$ = this.configService.moodOptionsState$;
  readonly currentLanguage = this.localization.currentLanguage;
  selectedEmotions = this.moodEntryService.draftSnapshot.emotions;
  showAllEmotions = false;
  private visibleEmotionChipCount = this.resolveVisibleEmotionChipCount();

  get selectedMoodValue(): number {
    return this.moodEntryService.draftSnapshot.moodLevel;
  }

  optionItems(options: readonly EmotionOption[], _language: string): ChipSelectorOption[] {
    return options.map((option) => ({
      value: option.label,
      label: this.localization.configLabel(option),
      icon: emotionIconForLabel(option.label),
    }));
  }

  displayedEmotionOptions(options: readonly EmotionOption[]): readonly EmotionOption[] {
    if (this.showAllEmotions) {
      return this.suggestedFirstEmotionOptions(options);
    }

    return this.collapsedEmotionOptions(options);
  }

  suggestedEmotionOptions(options: readonly EmotionOption[]): readonly EmotionOption[] {
    return options.filter((option) => option.moodRange?.includes(this.selectedMoodValue));
  }

  shouldShowAllButton(options: readonly EmotionOption[]): boolean {
    return this.collapsedEmotionOptions(options).length < this.suggestedFirstEmotionOptions(options).length;
  }

  @HostListener('window:resize')
  updateVisibleEmotionChipCount(): void {
    this.visibleEmotionChipCount = this.resolveVisibleEmotionChipCount();
  }

  toggleShowAll(): void {
    this.showAllEmotions = !this.showAllEmotions;
  }

  showAllToggleLabel(expanded: boolean): string {
    return this.currentLanguage() === 'he'
      ? expanded ? 'הצג פחות' : 'הצג עוד'
      : expanded ? 'Show Less' : 'Show More';
  }

  moodThemeClass(level: number): string {
    return moodThemeClassForLevel(level);
  }

  async next(): Promise<void> {
    this.moodEntryService.updateDraft({ emotions: this.selectedEmotions });
    await this.router.navigateByUrl('/check-in/influences');
  }

  private suggestedFirstEmotionOptions(options: readonly EmotionOption[]): readonly EmotionOption[] {
    const suggestedOptions = this.suggestedEmotionOptions(options);
    const suggestedLabels = new Set(suggestedOptions.map((option) => option.label));
    const remainingOptions = options.filter((option) => !suggestedLabels.has(option.label));

    return [...suggestedOptions, ...remainingOptions];
  }

  private collapsedEmotionOptions(options: readonly EmotionOption[]): readonly EmotionOption[] {
    const suggestedOptions = this.suggestedEmotionOptions(options);
    const initialOptions = suggestedOptions.length ? suggestedOptions : options;

    return initialOptions.slice(0, this.visibleEmotionChipCount);
  }

  private resolveVisibleEmotionChipCount(): number {
    const viewportHeight = typeof window === 'undefined'
      ? PHONE_VIEWPORT_HEIGHT
      : Math.round(window.visualViewport?.height ?? window.innerHeight);

    if (viewportHeight <= COMPACT_VIEWPORT_HEIGHT) {
      return COMPACT_EMOTION_CHIP_COUNT;
    }

    if (viewportHeight <= PHONE_VIEWPORT_HEIGHT) {
      return PHONE_EMOTION_CHIP_COUNT;
    }

    return TALL_EMOTION_CHIP_COUNT;
  }
}
