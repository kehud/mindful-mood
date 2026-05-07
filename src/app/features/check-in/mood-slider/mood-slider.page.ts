import { NgFor } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { MoodLevel } from '../../../core/models/mood-entry.model';
import { MoodEntryService } from '../../../core/services/mood-entry.service';

interface MoodState {
  value: MoodLevel;
  label: string;
  helper: string;
}

@Component({
  selector: 'app-mood-slider',
  standalone: true,
  imports: [FormsModule, IonicModule, NgFor, RouterLink],
  templateUrl: './mood-slider.page.html',
  styleUrls: ['./mood-slider.page.scss'],
})
export class MoodSliderPage {
  private readonly moodEntryService = inject(MoodEntryService);
  private readonly router = inject(Router);

  readonly moodStates: readonly MoodState[] = [
    { value: 1, label: 'Very unpleasant', helper: 'Heavy, hard, or deeply off.' },
    { value: 2, label: 'Unpleasant', helper: 'Something feels difficult.' },
    { value: 3, label: 'Slightly unpleasant', helper: 'A little uneasy or low.' },
    { value: 4, label: 'Neutral', helper: 'Steady, even, or in between.' },
    { value: 5, label: 'Slightly pleasant', helper: 'A small lift is here.' },
    { value: 6, label: 'Pleasant', helper: 'Light, settled, or content.' },
    { value: 7, label: 'Very pleasant', helper: 'Bright, open, or deeply good.' },
  ];

  moodLevel = this.moodEntryService.draftSnapshot.moodLevel;

  get selectedMood(): MoodState {
    return this.moodStates.find((state) => state.value === Number(this.moodLevel)) ?? this.moodStates[3];
  }

  selectMood(level: MoodLevel): void {
    this.moodLevel = level;
  }

  async next(): Promise<void> {
    this.moodEntryService.updateDraft({ moodLevel: Number(this.moodLevel) as MoodLevel });
    await this.router.navigateByUrl('/check-in/emotions');
  }
}
