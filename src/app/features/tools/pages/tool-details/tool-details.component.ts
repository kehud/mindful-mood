import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonicModule, NavController } from '@ionic/angular';
import { catchError, distinctUntilChanged, from, map, of, shareReplay, startWith, switchMap, tap } from 'rxjs';

import { ToolDefinition, ToolLocalizedText } from '../../../../core/models/tool.model';
import { EngagementService } from '../../../../core/services/engagement.service';
import { LocalizationService } from '../../../../core/services/localization.service';
import { ToolService } from '../../../../core/services/tool.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ActionPromptComponent } from '../../components/action-prompt/action-prompt.component';
import { TherapeuticSessionComponent } from '../../components/therapeutic-session/therapeutic-session.component';
import { ToolDetailsIntroComponent } from '../../components/tool-details-intro/tool-details-intro.component';

type ToolDetailsSessionState = 'intro' | 'active' | 'success';
type ToolCompletionLocalizedText = Partial<ToolLocalizedText>;
type ToolDefinitionWithType = ToolDefinition & { readonly type?: string };

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
    ActionPromptComponent,
    TherapeuticSessionComponent,
    ToolDetailsIntroComponent,
    TranslatePipe,
  ],
  templateUrl: './tool-details.component.html',
  styleUrls: ['./tool-details.component.scss'],
})
export class ToolDetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly engagementService = inject(EngagementService);
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
    return this.sessionState() === 'active' && this.isTherapeuticSessionTool(tool);
  }

  isActiveActionPrompt(tool: ToolDefinition): boolean {
    return this.sessionState() === 'active' && this.isActionPromptTool(tool);
  }

  isCompletedSession(tool: ToolDefinition): boolean {
    return this.sessionState() === 'success' && this.isRunnableTool(tool);
  }

  startTool(tool: ToolDefinition): void {
    if (!this.isRunnableTool(tool) || this.sessionState() !== 'intro') {
      return;
    }

    this.logRenderedComponent(tool);
    this.sessionState.set('active');
    void this.engagementService.trackToolOpened(tool, 'tool_details').catch(() => undefined);
  }

  exitActiveSession(): void {
    this.sessionState.set('intro');
  }

  completeActiveSession(tool: ToolDefinition, shouldTrackCompletion: boolean): void {
    if (this.sessionState() !== 'active') {
      return;
    }

    this.sessionState.set('success');

    if (shouldTrackCompletion) {
      void this.engagementService.trackToolCompleted(tool, 'tool_details').catch(() => undefined);
    }
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

  private isRunnableTool(tool: ToolDefinition): boolean {
    return this.isTherapeuticSessionTool(tool) || this.isActionPromptTool(tool);
  }

  private isTherapeuticSessionTool(tool: ToolDefinition): boolean {
    return tool.template === 'therapeutic_session';
  }

  private isActionPromptTool(tool: ToolDefinition): boolean {
    return tool.template === 'personal_activity' || tool.template === 'growth_action';
  }

  private logRenderedComponent(tool: ToolDefinition): void {
    const typedTool = tool as ToolDefinitionWithType;

    console.log('[ToolDetails] rendering component for type:', typedTool.type ?? tool.template);
  }
}
