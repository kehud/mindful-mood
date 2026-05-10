import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { InfluenceOption } from '../../../core/models/config-option.model';
import { ConfigService } from '../../../core/services/config.service';
import { LocalizationService } from '../../../core/services/localization.service';
import { MoodEntryService } from '../../../core/services/mood-entry.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ChipSelectorComponent, ChipSelectorOption } from '../../../shared/ui/chip-selector/chip-selector.component';

@Component({
  selector: 'app-influences-journal',
  standalone: true,
  imports: [AsyncPipe, ChipSelectorComponent, FormsModule, IonicModule, NgIf, RouterLink, TranslatePipe],
  templateUrl: './influences-journal.page.html',
  styleUrls: ['./influences-journal.page.scss'],
})
export class InfluencesJournalPage {
  private readonly configService = inject(ConfigService);
  private readonly localization = inject(LocalizationService);
  private readonly moodEntryService = inject(MoodEntryService);
  private readonly router = inject(Router);

  readonly influenceOptionsState$ = this.configService.influenceOptionsState$;
  readonly currentLanguage = this.localization.currentLanguage;
  selectedInfluences = this.moodEntryService.draftSnapshot.influences;
  journalNote = this.moodEntryService.draftSnapshot.journalNote;

  optionItems(options: readonly InfluenceOption[], _language: string): ChipSelectorOption[] {
    return options.map((option) => ({
      value: option.label,
      label: this.localization.configLabel(option),
    }));
  }

  async next(): Promise<void> {
    this.moodEntryService.updateDraft({
      influences: this.selectedInfluences,
      journalNote: this.journalNote,
    });
    await this.router.navigateByUrl('/check-in/review');
  }
}
