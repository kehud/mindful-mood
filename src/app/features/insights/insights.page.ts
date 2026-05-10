import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { ConfigService } from '../../core/services/config.service';
import { InsightsService } from '../../core/services/insights.service';
import { LocalizationService } from '../../core/services/localization.service';
import { MoodEntryService } from '../../core/services/mood-entry.service';
import { WellnessCardComponent } from '../../shared/components/wellness-card/wellness-card.component';
import { WellnessHeaderComponent } from '../../shared/components/wellness-header/wellness-header.component';
import { ConfigLabelPipe } from '../../shared/pipes/config-label.pipe';
import { MoodLabelPipe } from '../../shared/pipes/mood-label.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [
    AsyncPipe,
    ConfigLabelPipe,
    DatePipe,
    IonicModule,
    MoodLabelPipe,
    NgFor,
    NgIf,
    TranslatePipe,
    WellnessCardComponent,
    WellnessHeaderComponent,
  ],
  templateUrl: './insights.page.html',
  styleUrls: ['./insights.page.scss'],
})
export class InsightsPage {
  private readonly configService = inject(ConfigService);
  private readonly insightsService = inject(InsightsService);
  protected readonly localization = inject(LocalizationService);
  private readonly moodEntryService = inject(MoodEntryService);

  readonly moodOptionsState$ = this.configService.moodOptionsState$;
  readonly emotionOptionsState$ = this.configService.emotionOptionsState$;
  readonly influenceOptionsState$ = this.configService.influenceOptionsState$;
  readonly currentLanguage = this.localization.currentLanguage;
  readonly summary$ = this.insightsService.summary$;
  readonly entriesLoading$ = this.moodEntryService.entriesLoading$;
  readonly entriesError$ = this.moodEntryService.entriesError$;
}
