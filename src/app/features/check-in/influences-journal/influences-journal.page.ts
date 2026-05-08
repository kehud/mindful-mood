import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { InfluenceOption } from '../../../core/models/config-option.model';
import { ConfigService } from '../../../core/services/config.service';
import { MoodEntryService } from '../../../core/services/mood-entry.service';
import { ChipSelectorComponent } from '../../../shared/ui/chip-selector/chip-selector.component';

@Component({
  selector: 'app-influences-journal',
  standalone: true,
  imports: [AsyncPipe, ChipSelectorComponent, FormsModule, IonicModule, NgIf, RouterLink],
  templateUrl: './influences-journal.page.html',
  styleUrls: ['./influences-journal.page.scss'],
})
export class InfluencesJournalPage {
  private readonly configService = inject(ConfigService);
  private readonly moodEntryService = inject(MoodEntryService);
  private readonly router = inject(Router);

  readonly influenceOptionsState$ = this.configService.influenceOptionsState$;
  selectedInfluences = this.moodEntryService.draftSnapshot.influences;
  journalNote = this.moodEntryService.draftSnapshot.journalNote;

  optionLabels(options: readonly InfluenceOption[]): string[] {
    return options.map((option) => option.label);
  }

  async next(): Promise<void> {
    this.moodEntryService.updateDraft({
      influences: this.selectedInfluences,
      journalNote: this.journalNote,
    });
    await this.router.navigateByUrl('/check-in/review');
  }
}
