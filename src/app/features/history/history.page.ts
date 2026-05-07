import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { MoodEntryService } from '../../core/services/mood-entry.service';
import { WellnessCardComponent } from '../../shared/components/wellness-card/wellness-card.component';
import { WellnessHeaderComponent } from '../../shared/components/wellness-header/wellness-header.component';
import { MoodLabelPipe } from '../../shared/pipes/mood-label.pipe';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [AsyncPipe, DatePipe, IonicModule, MoodLabelPipe, NgFor, NgIf, RouterLink, WellnessCardComponent, WellnessHeaderComponent],
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
})
export class HistoryPage {
  private readonly moodEntryService = inject(MoodEntryService);

  readonly entries$ = this.moodEntryService.entries$;
  readonly entriesLoading$ = this.moodEntryService.entriesLoading$;
  readonly entriesError$ = this.moodEntryService.entriesError$;
}
