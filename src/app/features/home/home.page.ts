import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { map } from 'rxjs';

import { MoodEntryService } from '../../core/services/mood-entry.service';
import { WellnessCardComponent } from '../../shared/components/wellness-card/wellness-card.component';
import { WellnessHeaderComponent } from '../../shared/components/wellness-header/wellness-header.component';
import { MoodLabelPipe } from '../../shared/pipes/mood-label.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    IonicModule,
    MoodLabelPipe,
    NgFor,
    NgIf,
    RouterLink,
    WellnessCardComponent,
    WellnessHeaderComponent,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  private readonly moodEntryService = inject(MoodEntryService);

  readonly lastEntry$ = this.moodEntryService.entries$.pipe(map((entries) => entries[0] ?? null));
  readonly quickInfluences = ['Sleep', 'Work', 'Movement'];
}
