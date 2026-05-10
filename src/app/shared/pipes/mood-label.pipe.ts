import { Pipe, PipeTransform, inject } from '@angular/core';

import { MoodOption } from '../../core/models/config-option.model';
import { LocalizationService } from '../../core/services/localization.service';

const FALLBACK_LABEL_KEYS: Record<number, string> = {
  1: 'mood.1',
  2: 'mood.2',
  3: 'mood.3',
  4: 'mood.4',
  5: 'mood.5',
  6: 'mood.6',
  7: 'mood.7',
};

@Pipe({
  name: 'moodLabel',
  pure: false,
  standalone: true,
})
export class MoodLabelPipe implements PipeTransform {
  private readonly localization = inject(LocalizationService);

  transform(value: number, options?: readonly MoodOption[] | null): string {
    if (!Number.isFinite(value) || value < 1) {
      return this.localization.translate('mood.notSet');
    }

    const level = Math.round(value);
    const option = options?.find((item) => item.value === level);

    if (option) {
      return this.localization.configLabel(option);
    }

    const fallbackKey = FALLBACK_LABEL_KEYS[level];

    return fallbackKey ? this.localization.translate(fallbackKey) : this.localization.translate('mood.level', { level });
  }
}
