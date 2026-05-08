import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { EmotionOption } from '../../../core/models/config-option.model';
import { ConfigService } from '../../../core/services/config.service';
import { MoodEntryService } from '../../../core/services/mood-entry.service';
import { ChipSelectorComponent } from '../../../shared/ui/chip-selector/chip-selector.component';

@Component({
  selector: 'app-emotion-selection',
  standalone: true,
  imports: [AsyncPipe, ChipSelectorComponent, IonicModule, NgIf, RouterLink],
  templateUrl: './emotion-selection.page.html',
  styleUrls: ['./emotion-selection.page.scss'],
})
export class EmotionSelectionPage {
  private readonly configService = inject(ConfigService);
  private readonly moodEntryService = inject(MoodEntryService);
  private readonly router = inject(Router);

  readonly emotionOptionsState$ = this.configService.emotionOptionsState$;
  selectedEmotions = this.moodEntryService.draftSnapshot.emotions;

  optionLabels(options: readonly EmotionOption[]): string[] {
    return options.map((option) => option.label);
  }

  async next(): Promise<void> {
    this.moodEntryService.updateDraft({ emotions: this.selectedEmotions });
    await this.router.navigateByUrl('/check-in/influences');
  }
}
