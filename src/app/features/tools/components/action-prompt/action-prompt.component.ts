import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { ToolDefinition, ToolPromptText } from '../../../../core/models/tool.model';
import { LocalizationService } from '../../../../core/services/localization.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-action-prompt',
  standalone: true,
  imports: [IonicModule, TranslatePipe],
  templateUrl: './action-prompt.component.html',
  styleUrls: ['./action-prompt.component.scss'],
})
export class ActionPromptComponent {
  private readonly localization = inject(LocalizationService);

  @Input({ required: true }) tool!: ToolDefinition;
  @Output() readonly exit = new EventEmitter<void>();
  @Output() readonly complete = new EventEmitter<void>();

  readonly currentDirection = this.localization.direction;

  title(): string {
    return this.localizedText(this.tool.title);
  }

  promptText(): string {
    return (
      this.localizedText(this.tool.prompt) ||
      this.localizedText(this.tool.actionPrompt) ||
      this.localizedText(this.tool.description)
    );
  }

  exitPrompt(): void {
    this.exit.emit();
  }

  completePrompt(): void {
    this.complete.emit();
  }

  private localizedText(text: ToolPromptText | null | undefined): string {
    if (!text) {
      return '';
    }

    if (typeof text === 'string') {
      return text.trim();
    }

    const language = this.localization.currentLanguage();

    return text[language]?.trim() || text.en?.trim() || text.he?.trim() || '';
  }
}
