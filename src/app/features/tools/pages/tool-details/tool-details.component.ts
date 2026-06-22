import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonicModule, NavController } from '@ionic/angular';
import { catchError, distinctUntilChanged, from, map, of, shareReplay, startWith, switchMap, tap } from 'rxjs';

import { ToolDefinition, ToolLocalizedText } from '../../../../core/models/tool.model';
import { LocalizationService } from '../../../../core/services/localization.service';
import { ToolService } from '../../../../core/services/tool.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TherapeuticSessionComponent } from '../../components/therapeutic-session/therapeutic-session.component';
import { ToolDetailsIntroComponent } from '../../components/tool-details-intro/tool-details-intro.component';

type ToolDetailsSessionState = 'intro' | 'active' | 'success';
type ToolCompletionLocalizedText = Partial<ToolLocalizedText>;

interface ToolDetailsState {
  readonly loading: boolean;
  readonly tool: ToolDefinition | null;
}

interface ToolCompletionTitleCandidate {
  readonly completionTitle?: ToolCompletionLocalizedText;
}

@Component({
  selector: 'app-tool-details',
  standalone: true,
  imports: [
    AsyncPipe,
    IonicModule,
    NgIf,
    RouterLink,
    TherapeuticSessionComponent,
    ToolDetailsIntroComponent,
    TranslatePipe,
  ],
  templateUrl: './tool-details.component.html',
  styleUrls: ['./tool-details.component.scss'],
})
export class ToolDetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly localization = inject(LocalizationService);
  private readonly navController = inject(NavController);
  private readonly toolService = inject(ToolService);
  private readonly sessionState = signal<ToolDetailsSessionState>('intro');

  readonly toolState$ = this.route.paramMap.pipe(
    map((params) => params.get('toolId')?.trim() ?? ''),
    distinctUntilChanged(),
    tap(() => this.sessionState.set('intro')),
    switchMap((toolId) => {
      if (!toolId) {
        return of<ToolDetailsState>({ loading: false, tool: null });
      }

      return from(this.toolService.getToolById(toolId)).pipe(
        map((tool): ToolDetailsState => ({ loading: false, tool })),
        catchError(() => of<ToolDetailsState>({ loading: false, tool: null })),
        startWith({ loading: true, tool: null } satisfies ToolDetailsState),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  isActiveTherapeuticSession(tool: ToolDefinition): boolean {
    return this.sessionState() === 'active' && tool.template === 'therapeutic_session';
  }

  isCompletedTherapeuticSession(tool: ToolDefinition): boolean {
    return this.sessionState() === 'success' && tool.template === 'therapeutic_session';
  }

  startTool(tool: ToolDefinition): void {
    if (tool.template !== 'therapeutic_session') {
      return;
    }

    this.sessionState.set('active');
  }

  exitActiveSession(): void {
    this.sessionState.set('intro');
  }

  completeActiveSession(): void {
    this.sessionState.set('success');
  }

  async finishCompletedSession(): Promise<void> {
    await this.navController.navigateRoot('/tabs/tools', { replaceUrl: true });
  }

  successTitle(tool: ToolDefinition): string {
    const completionTitle = (tool as ToolDefinition & ToolCompletionTitleCandidate).completionTitle;

    return this.localizedText(completionTitle) || 'Nice work';
  }

  successMessage(tool: ToolDefinition): string {
    return this.localizedText(tool.completionText) || 'You took a moment for yourself.';
  }

  private localizedText(text: ToolCompletionLocalizedText | null | undefined): string {
    if (!text) {
      return '';
    }

    const language = this.localization.currentLanguage();

    return text[language]?.trim() || text.en?.trim() || text.he?.trim() || '';
  }
}
