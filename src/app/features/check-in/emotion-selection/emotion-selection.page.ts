import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { MoodEntryService } from '../../../core/services/mood-entry.service';
import { ChipSelectorComponent } from '../../../shared/ui/chip-selector/chip-selector.component';

@Component({
  selector: 'app-emotion-selection',
  standalone: true,
  imports: [ChipSelectorComponent, IonicModule, RouterLink],
  templateUrl: './emotion-selection.page.html',
  styleUrls: ['./emotion-selection.page.scss'],
})
export class EmotionSelectionPage {
  private readonly moodEntryService = inject(MoodEntryService);
  private readonly router = inject(Router);

  readonly emotions = [
    'Calm',
    'Happy',
    'Grateful',
    'Focused',
    'Excited',
    'Proud',
    'Sad',
    'Anxious',
    'Angry',
    'Tired',
    'Lonely',
    'Overwhelmed',
    'Hopeful',
    'Relaxed',
    'Stressed',
    'Frustrated',
  ];

  selectedEmotions = this.moodEntryService.draftSnapshot.emotions;

  async next(): Promise<void> {
    this.moodEntryService.updateDraft({ emotions: this.selectedEmotions });
    await this.router.navigateByUrl('/check-in/influences');
  }
}
