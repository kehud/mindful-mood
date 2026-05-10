import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { EmotionOption } from '../../../core/models/config-option.model';
import { ConfigService } from '../../../core/services/config.service';
import { LocalizationService } from '../../../core/services/localization.service';
import { MoodEntryService } from '../../../core/services/mood-entry.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ChipSelectorComponent, ChipSelectorOption } from '../../../shared/ui/chip-selector/chip-selector.component';

@Component({
  selector: 'app-emotion-selection',
  standalone: true,
  imports: [AsyncPipe, ChipSelectorComponent, IonicModule, NgIf, RouterLink, TranslatePipe],
  templateUrl: './emotion-selection.page.html',
  styleUrls: ['./emotion-selection.page.scss'],
})
export class EmotionSelectionPage {
  private readonly configService = inject(ConfigService);
  private readonly localization = inject(LocalizationService);
  private readonly moodEntryService = inject(MoodEntryService);
  private readonly router = inject(Router);

  readonly emotionOptionsState$ = this.configService.emotionOptionsState$;
  readonly currentLanguage = this.localization.currentLanguage;
  readonly selectedMoodValue = this.moodEntryService.draftSnapshot.moodLevel;
  selectedEmotions = this.moodEntryService.draftSnapshot.emotions;
  showAllEmotions = false;

  optionItems(options: readonly EmotionOption[], _language: string): ChipSelectorOption[] {
    return options.map((option) => ({
      value: option.label,
      label: this.localization.configLabel(option),
    }));
  }

  displayedEmotionOptions(options: readonly EmotionOption[]): readonly EmotionOption[] {
    const suggestedOptions = this.suggestedEmotionOptions(options);

    if (this.showAllEmotions || !suggestedOptions.length) {
      return this.suggestedFirstEmotionOptions(options);
    }

    return suggestedOptions;
  }

  suggestedEmotionOptions(options: readonly EmotionOption[]): readonly EmotionOption[] {
    return options.filter((option) => option.moodRange?.includes(this.selectedMoodValue));
  }

  shouldShowAllButton(options: readonly EmotionOption[]): boolean {
    const suggestedCount = this.suggestedEmotionOptions(options).length;
    return !this.showAllEmotions && suggestedCount > 0 && suggestedCount < options.length;
  }

  showAll(): void {
    this.showAllEmotions = true;
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
}
