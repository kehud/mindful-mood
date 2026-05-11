import { AsyncPipe, NgClass, NgFor, NgIf } from '@angular/common';
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

const FALLBACK_MOOD_OPTION: MoodOption = {
  value: 4,
  label: 'Neutral',
  icon: 'ellipse-outline',
  color: '#B8A6FF',
  order: 4,
};

const MOOD_TONES = ['very-low', 'low', 'middle', 'high', 'very-high'] as const;
const MOOD_TONE_LABEL_KEYS: Record<(typeof MOOD_TONES)[number], string> = {
  'very-low': 'checkIn.mood.tone.veryLow',
  low: 'checkIn.mood.tone.low',
  middle: 'checkIn.mood.tone.middle',
  high: 'checkIn.mood.tone.high',
  'very-high': 'checkIn.mood.tone.veryHigh',
};
const MOOD_SUPPORT_KEYS: Record<(typeof MOOD_TONES)[number], string> = {
  'very-low': 'checkIn.mood.support.veryLow',
  low: 'checkIn.mood.support.low',
  middle: 'checkIn.mood.support.middle',
  high: 'checkIn.mood.support.high',
  'very-high': 'checkIn.mood.support.veryHigh',
};

@Component({
  selector: 'app-mood-slider',
  standalone: true,
  imports: [AsyncPipe, ConfigLabelPipe, FormsModule, IonicModule, NgClass, NgFor, NgIf, RouterLink, TranslatePipe],
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

  selectMood(level: MoodLevel): void {
    this.updateMoodLevel(level);
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

  moodVisualTone(mood: MoodOption, options: readonly MoodOption[]): string {
    return `mood-visual--${this.moodTone(mood, options)}`;
  }

  moodToneLabel(mood: MoodOption, options: readonly MoodOption[]): string {
    return this.localization.translate(MOOD_TONE_LABEL_KEYS[this.moodTone(mood, options)]);
  }

  moodSupportText(mood: MoodOption, options: readonly MoodOption[]): string {
    return this.localization.translate(MOOD_SUPPORT_KEYS[this.moodTone(mood, options)]);
  }

  moodVisualScale(mood: MoodOption, options: readonly MoodOption[]): string {
    return (0.94 + this.moodProgress(mood, options) * 0.12).toFixed(2);
  }

  moodVisualTilt(mood: MoodOption, options: readonly MoodOption[]): string {
    return `${(-7 + this.moodProgress(mood, options) * 14).toFixed(1)}deg`;
  }

  moodVisualLift(mood: MoodOption, options: readonly MoodOption[]): string {
    return `${(10 - this.moodProgress(mood, options) * 18).toFixed(1)}px`;
  }

  trackMoodOption(_index: number, option: MoodOption): number {
    return option.value;
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

  private moodTone(mood: MoodOption, options: readonly MoodOption[]): (typeof MOOD_TONES)[number] {
    const toneIndex = Math.min(
      MOOD_TONES.length - 1,
      Math.max(0, Math.round(this.moodProgress(mood, options) * (MOOD_TONES.length - 1))),
    );

    return MOOD_TONES[toneIndex];
  }

  private moodProgress(mood: MoodOption, options: readonly MoodOption[]): number {
    const min = this.moodRangeMin(options);
    const max = this.moodRangeMax(options);

    if (min === max) {
      return 0.5;
    }

    return Math.min(1, Math.max(0, (mood.value - min) / (max - min)));
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
