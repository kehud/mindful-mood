import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { MoodOption } from '../../../core/models/config-option.model';
import { MoodLevel } from '../../../core/models/mood-entry.model';
import { ConfigService } from '../../../core/services/config.service';
import { MoodEntryService } from '../../../core/services/mood-entry.service';

const FALLBACK_MOOD_OPTION: MoodOption = {
  value: 4,
  label: 'Neutral',
  icon: 'ellipse-outline',
  color: '#4d8d7c',
  order: 4,
};

@Component({
  selector: 'app-mood-slider',
  standalone: true,
  imports: [AsyncPipe, FormsModule, IonicModule, NgFor, NgIf, RouterLink],
  templateUrl: './mood-slider.page.html',
  styleUrls: ['./mood-slider.page.scss'],
})
export class MoodSliderPage {
  private readonly configService = inject(ConfigService);
  private readonly moodEntryService = inject(MoodEntryService);
  private readonly router = inject(Router);

  readonly moodOptionsState$ = this.configService.moodOptionsState$;
  moodLevel = this.moodEntryService.draftSnapshot.moodLevel;

  selectedMood(options: readonly MoodOption[]): MoodOption {
    return this.findClosestMoodOption(Number(this.moodLevel), options);
  }

  selectMood(level: MoodLevel): void {
    this.moodLevel = level;
  }

  snapMoodLevel(options: readonly MoodOption[]): void {
    this.moodLevel = this.findClosestMoodOption(Number(this.moodLevel), options).value;
  }

  moodRangeMin(options: readonly MoodOption[]): number {
    return options.length ? Math.min(...options.map((option) => option.value)) : FALLBACK_MOOD_OPTION.value;
  }

  moodRangeMax(options: readonly MoodOption[]): number {
    return options.length ? Math.max(...options.map((option) => option.value)) : FALLBACK_MOOD_OPTION.value;
  }

  moodRangeLabel(options: readonly MoodOption[], position: 'start' | 'middle' | 'end'): string {
    if (!options.length) {
      return FALLBACK_MOOD_OPTION.label;
    }

    if (position === 'start') {
      return options[0].label;
    }

    if (position === 'end') {
      return options[options.length - 1].label;
    }

    return options[Math.floor(options.length / 2)].label;
  }

  async next(options: readonly MoodOption[]): Promise<void> {
    this.moodEntryService.updateDraft({ moodLevel: this.findClosestMoodOption(Number(this.moodLevel), options).value });
    await this.router.navigateByUrl('/check-in/emotions');
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
