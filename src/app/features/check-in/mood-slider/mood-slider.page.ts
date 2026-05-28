import { AsyncPipe, NgClass, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule, RangeCustomEvent } from '@ionic/angular';

import { MoodOption } from '../../../core/models/config-option.model';
import { MoodLevel } from '../../../core/models/mood-entry.model';
import { ConfigService } from '../../../core/services/config.service';
import { LocalizationService } from '../../../core/services/localization.service';
import { MoodEntryService } from '../../../core/services/mood-entry.service';
import { ConfigLabelPipe } from '../../../shared/pipes/config-label.pipe';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { moodBloomClassForLevel, moodThemeClassForLevel } from '../check-in-mood-theme';

const FALLBACK_MOOD_OPTION: MoodOption = {
  value: 4,
  label: 'Neutral',
  icon: 'ellipse-outline',
  color: '#78C9CB',
  order: 4,
};

@Component({
  selector: 'app-mood-slider',
  standalone: true,
  imports: [AsyncPipe, ConfigLabelPipe, FormsModule, IonicModule, NgClass, NgIf, RouterLink, TranslatePipe],
  templateUrl: './mood-slider.page.html',
  styleUrls: ['./mood-slider.page.scss'],
})
export class MoodSliderPage {
  private readonly configService = inject(ConfigService);
  private readonly localization = inject(LocalizationService);
  private readonly moodEntryService = inject(MoodEntryService);
  private readonly router = inject(Router);

  readonly moodOptionsState$ = this.configService.moodOptionsState$;
  moodLevel = this.moodEntryService.draftSnapshot.moodLevel;

  selectedMood(options: readonly MoodOption[]): MoodOption {
    return this.findClosestMoodOption(Number(this.moodLevel), options);
  }

  snapMoodLevel(options: readonly MoodOption[]): void {
    this.updateMoodLevel(this.findClosestMoodOption(Number(this.moodLevel), options).value);
  }

  previewMood(event: RangeCustomEvent, options: readonly MoodOption[]): void {
    this.updateMoodLevel(this.findClosestMoodOption(this.rangeEventValue(event), options).value);
  }

  moodRangeMin(options: readonly MoodOption[]): number {
    return options.length ? Math.min(...options.map((option) => option.value)) : FALLBACK_MOOD_OPTION.value;
  }

  moodRangeMax(options: readonly MoodOption[]): number {
    return options.length ? Math.max(...options.map((option) => option.value)) : FALLBACK_MOOD_OPTION.value;
  }

  moodRangeLabel(options: readonly MoodOption[], position: 'start' | 'middle' | 'end'): string {
    if (!options.length) {
      return this.localization.configLabel(FALLBACK_MOOD_OPTION);
    }

    if (position === 'start') {
      return this.localization.configLabel(options[0]);
    }

    if (position === 'end') {
      return this.localization.configLabel(options[options.length - 1]);
    }

    return this.localization.configLabel(options[Math.floor(options.length / 2)]);
  }

  moodThemeClass(level: MoodLevel): string {
    return moodThemeClassForLevel(level);
  }

  moodBloomClass(level: MoodLevel): string {
    return moodBloomClassForLevel(level);
  }

  async next(options: readonly MoodOption[]): Promise<void> {
    this.moodEntryService.updateDraft({ moodLevel: this.findClosestMoodOption(Number(this.moodLevel), options).value });
    await this.router.navigateByUrl('/check-in/emotions');
  }

  private updateMoodLevel(level: MoodLevel): void {
    this.moodLevel = level;
    this.prepareMoodFeedback(level);
  }

  private prepareMoodFeedback(_level: MoodLevel): void {
    // Reserved for future haptic feedback wiring; intentionally no native side effects yet.
  }

  private rangeEventValue(event: RangeCustomEvent): number {
    const value = event.detail.value;

    return typeof value === 'number' ? value : value.lower;
  }

  private findClosestMoodOption(value: number, options: readonly MoodOption[]): MoodOption {
    if (!options.length || !Number.isFinite(value)) {
      return options[0] ?? FALLBACK_MOOD_OPTION;
    }

    return options.reduce((closest, option) =>
      Math.abs(option.value - value) < Math.abs(closest.value - value) ? option : closest,
    );
  }
}
