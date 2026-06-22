import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { DEFAULT_EMOTION_OPTIONS, ConfigService } from '../../../../core/services/config.service';
import { EmotionOption } from '../../../../core/models/config-option.model';
import { ToolDefinition, ToolLocalizedText } from '../../../../core/models/tool.model';
import { LocalizationService } from '../../../../core/services/localization.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

const TOOL_DETAIL_ICON_NAMES_BY_KEY: Record<string, string> = {
  body: 'body-outline',
  breathing: 'leaf-outline',
  create: 'create-outline',
  friend: 'people-circle-outline',
  goal: 'flag-outline',
  gratitude: 'sparkles-outline',
  grounding: 'leaf-outline',
  learn: 'school-outline',
  meditation: 'leaf-outline',
  music: 'musical-notes-outline',
  nature: 'leaf-outline',
  photography: 'camera-outline',
  reading: 'book-outline',
  walk: 'walk-outline',
};

@Component({
  selector: 'app-tool-details-intro',
  standalone: true,
  imports: [AsyncPipe, IonicModule, NgFor, NgIf, RouterLink, TranslatePipe],
  templateUrl: './tool-details-intro.component.html',
  styleUrls: ['./tool-details-intro.component.scss'],
})
export class ToolDetailsIntroComponent {
  private readonly configService = inject(ConfigService);
  private readonly localization = inject(LocalizationService);

  @Input({ required: true }) tool!: ToolDefinition;
  @Output() readonly start = new EventEmitter<void>();

  readonly currentDirection = this.localization.direction;
  readonly emotionOptionsState$ = this.configService.emotionOptionsState$;

  get helpTags(): readonly string[] {
    return this.tool?.recommendationTags.emotions ?? [];
  }

  title(): string {
    return this.localizedText(this.tool.title);
  }

  description(): string {
    return this.localizedText(this.tool.description);
  }

  hasDuration(): boolean {
    return typeof this.tool.durationSeconds === 'number' && Number.isFinite(this.tool.durationSeconds);
  }

  durationLabel(): string {
    if (!this.hasDuration()) {
      return this.localization.translate('tools.details.flexible');
    }

    const totalSeconds = Math.max(1, Math.round(this.tool.durationSeconds ?? 0));

    if (totalSeconds < 60) {
      return this.localization.translate(
        totalSeconds === 1
          ? 'tools.details.duration.secondOne'
          : 'tools.details.duration.secondMany',
        { count: totalSeconds },
      );
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (seconds === 0) {
      return this.localization.translate(
        minutes === 1
          ? 'tools.details.duration.minuteOne'
          : 'tools.details.duration.minuteMany',
        { count: minutes },
      );
    }

    return this.localization.translate('tools.details.duration.minutesSeconds', {
      minutes,
      seconds,
    });
  }

  toolIconName(): string {
    return TOOL_DETAIL_ICON_NAMES_BY_KEY[this.tool.iconKey] ?? this.tool.iconKey ?? 'leaf-outline';
  }

  emotionLabel(tag: string, options: readonly EmotionOption[] | null | undefined): string {
    const option = this.findEmotionOption(tag, options) ?? this.findEmotionOption(tag, DEFAULT_EMOTION_OPTIONS);

    return option ? this.localization.configLabel(option) : this.readableTag(tag);
  }

  trackTag(_index: number, tag: string): string {
    return tag;
  }

  startSession(): void {
    this.start.emit();
  }

  private localizedText(text: ToolLocalizedText): string {
    const language = this.localization.currentLanguage();

    return text[language]?.trim() || text.en.trim();
  }

  private findEmotionOption(
    tag: string,
    options: readonly EmotionOption[] | null | undefined,
  ): EmotionOption | null {
    const normalizedTag = this.normalizeTag(tag);

    return options?.find((option) => this.normalizeTag(option.label) === normalizedTag) ?? null;
  }

  private readableTag(tag: string): string {
    return tag
      .trim()
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private normalizeTag(tag: string): string {
    return tag.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  }
}
