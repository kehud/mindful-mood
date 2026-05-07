import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { MoodEntryService } from '../../../core/services/mood-entry.service';
import { ChipSelectorComponent } from '../../../shared/ui/chip-selector/chip-selector.component';

@Component({
  selector: 'app-influences-journal',
  standalone: true,
  imports: [ChipSelectorComponent, FormsModule, IonicModule, RouterLink],
  templateUrl: './influences-journal.page.html',
  styleUrls: ['./influences-journal.page.scss'],
})
export class InfluencesJournalPage {
  private readonly moodEntryService = inject(MoodEntryService);
  private readonly router = inject(Router);

  readonly influences = [
    'Family',
    'Partner',
    'Friends',
    'Work',
    'School',
    'Health',
    'Fitness',
    'Sleep',
    'Food',
    'Weather',
    'Money',
    'News',
    'Social media',
    'Hobbies',
    'Travel',
    'Other',
  ];

  selectedInfluences = this.moodEntryService.draftSnapshot.influences;
  journalNote = this.moodEntryService.draftSnapshot.journalNote;

  async next(): Promise<void> {
    this.moodEntryService.updateDraft({
      influences: this.selectedInfluences,
      journalNote: this.journalNote,
    });
    await this.router.navigateByUrl('/check-in/review');
  }
}
