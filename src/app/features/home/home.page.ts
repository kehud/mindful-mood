import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { map } from 'rxjs';

import { ConfigService } from '../../core/services/config.service';
import { LocalizationService } from '../../core/services/localization.service';
import { MoodEntryService } from '../../core/services/mood-entry.service';
import { WellnessCardComponent } from '../../shared/components/wellness-card/wellness-card.component';
import { WellnessHeaderComponent } from '../../shared/components/wellness-header/wellness-header.component';
import { ConfigLabelPipe } from '../../shared/pipes/config-label.pipe';
import { MoodLabelPipe } from '../../shared/pipes/mood-label.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-home',
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
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  private readonly configService = inject(ConfigService);
  protected readonly localization = inject(LocalizationService);
  private readonly moodEntryService = inject(MoodEntryService);

  readonly moodOptionsState$ = this.configService.moodOptionsState$;
  readonly influenceOptionsState$ = this.configService.influenceOptionsState$;
  readonly currentLanguage = this.localization.currentLanguage;
  readonly lastEntry$ = this.moodEntryService.entries$.pipe(map((entries) => entries[0] ?? null));
  readonly quickInfluences = ['Sleep', 'Work', 'Fitness'];
}
