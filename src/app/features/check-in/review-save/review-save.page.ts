import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { CheckInDraft } from '../../../core/models/mood-entry.model';
import { ConfigService } from '../../../core/services/config.service';
import { MoodEntryService } from '../../../core/services/mood-entry.service';
import { ConfigLabelPipe } from '../../../shared/pipes/config-label.pipe';
import { MoodLabelPipe } from '../../../shared/pipes/mood-label.pipe';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-review-save',
  standalone: true,
  imports: [AsyncPipe, ConfigLabelPipe, IonicModule, MoodLabelPipe, NgFor, NgIf, RouterLink, TranslatePipe],
  templateUrl: './review-save.page.html',
  styleUrls: ['./review-save.page.scss'],
})
export class ReviewSavePage {
  private readonly configService = inject(ConfigService);
  private readonly moodEntryService = inject(MoodEntryService);
  private readonly router = inject(Router);

  readonly moodOptionsState$ = this.configService.moodOptionsState$;
  readonly emotionOptionsState$ = this.configService.emotionOptionsState$;
  readonly influenceOptionsState$ = this.configService.influenceOptionsState$;
  readonly draft: CheckInDraft = this.moodEntryService.draftSnapshot;
  isSaving = false;
  errorMessage = '';

  async save(): Promise<void> {
    this.errorMessage = '';
    this.isSaving = true;

    try {
      console.log('Saving check-in', this.draft);
      const entry = await this.moodEntryService.saveDraft();
      console.log('Saved Firestore check-in', entry);
      await this.router.navigateByUrl('/tabs/history');
    } catch (error) {
      this.errorMessage = this.moodEntryService.getErrorMessage(error);
    } finally {
      this.isSaving = false;
    }
  }
}
