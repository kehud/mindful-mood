import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { InsightsService } from '../../core/services/insights.service';
import { MoodEntryService } from '../../core/services/mood-entry.service';
import { WellnessCardComponent } from '../../shared/components/wellness-card/wellness-card.component';
import { WellnessHeaderComponent } from '../../shared/components/wellness-header/wellness-header.component';
import { MoodLabelPipe } from '../../shared/pipes/mood-label.pipe';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [AsyncPipe, IonicModule, MoodLabelPipe, NgFor, NgIf, WellnessCardComponent, WellnessHeaderComponent],
  templateUrl: './insights.page.html',
  styleUrls: ['./insights.page.scss'],
})
export class InsightsPage {
  private readonly insightsService = inject(InsightsService);
  private readonly moodEntryService = inject(MoodEntryService);

  readonly summary$ = this.insightsService.summary$;
  readonly entriesLoading$ = this.moodEntryService.entriesLoading$;
  readonly entriesError$ = this.moodEntryService.entriesError$;
}
