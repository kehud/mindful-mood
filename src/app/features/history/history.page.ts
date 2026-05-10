import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { ConfigService } from '../../core/services/config.service';
import { LocalizationService } from '../../core/services/localization.service';
import { MoodEntryService } from '../../core/services/mood-entry.service';
import { WellnessCardComponent } from '../../shared/components/wellness-card/wellness-card.component';
import { WellnessHeaderComponent } from '../../shared/components/wellness-header/wellness-header.component';
import { ConfigLabelPipe } from '../../shared/pipes/config-label.pipe';
import { MoodLabelPipe } from '../../shared/pipes/mood-label.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    AsyncPipe,
    ConfigLabelPipe,
    DatePipe,
    IonicModule,
    MoodLabelPipe,
    NgFor,
    NgIf,
    RouterLink,
    TranslatePipe,
    WellnessCardComponent,
    WellnessHeaderComponent,
  ],
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
})
export class HistoryPage {
  private readonly configService = inject(ConfigService);
  protected readonly localization = inject(LocalizationService);
  private readonly moodEntryService = inject(MoodEntryService);

  readonly moodOptionsState$ = this.configService.moodOptionsState$;
  readonly emotionOptionsState$ = this.configService.emotionOptionsState$;
  readonly influenceOptionsState$ = this.configService.influenceOptionsState$;
  readonly currentLanguage = this.localization.currentLanguage;
  readonly entries$ = this.moodEntryService.entries$;
  readonly entriesLoading$ = this.moodEntryService.entriesLoading$;
  readonly entriesError$ = this.moodEntryService.entriesError$;
}
