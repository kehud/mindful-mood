import { NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { CheckInDraft } from '../../../core/models/mood-entry.model';
import { MoodEntryService } from '../../../core/services/mood-entry.service';
import { MoodLabelPipe } from '../../../shared/pipes/mood-label.pipe';

@Component({
  selector: 'app-review-save',
  standalone: true,
  imports: [IonicModule, MoodLabelPipe, NgFor, NgIf, RouterLink],
  templateUrl: './review-save.page.html',
  styleUrls: ['./review-save.page.scss'],
})
export class ReviewSavePage {
  private readonly moodEntryService = inject(MoodEntryService);
  private readonly router = inject(Router);

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
