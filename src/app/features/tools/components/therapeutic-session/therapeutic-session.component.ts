import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { ToolDefinition, ToolLocalizedText } from '../../../../core/models/tool.model';
import { LocalizationService } from '../../../../core/services/localization.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-therapeutic-session',
  standalone: true,
  imports: [IonicModule, TranslatePipe],
  templateUrl: './therapeutic-session.component.html',
  styleUrls: ['./therapeutic-session.component.scss'],
})
export class TherapeuticSessionComponent {
  private readonly localization = inject(LocalizationService);

  @Input({ required: true }) tool!: ToolDefinition;
  @Output() readonly exit = new EventEmitter<void>();
  @Output() readonly complete = new EventEmitter<void>();

  readonly currentDirection = this.localization.direction;

  title(): string {
    return this.localizedText(this.tool.title);
  }

  guidanceText(): string {
    const firstStep = this.tool.steps?.[0];

    if (firstStep) {
      const localizedStep = this.localizedText(firstStep);

      if (localizedStep) {
        return localizedStep;
      }
    }

    return this.localization.translate('tools.session.fallbackGuidance');
  }

  durationLabel(): string {
    const durationSeconds = this.tool.durationSeconds;

    if (typeof durationSeconds !== 'number' || !Number.isFinite(durationSeconds)) {
      return this.localization.translate('tools.details.flexible');
    }

    const totalSeconds = Math.max(0, Math.round(durationSeconds));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  exitSession(): void {
    this.exit.emit();
  }

  completeSession(): void {
    this.complete.emit();
  }

  private localizedText(text: ToolLocalizedText): string {
    const language = this.localization.currentLanguage();

    return text[language]?.trim() || text.en.trim() || text.he.trim();
  }
}
