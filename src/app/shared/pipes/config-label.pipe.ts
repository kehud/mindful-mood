import { Pipe, PipeTransform, inject } from '@angular/core';

import { LocalizationService, LocalizedConfigLabel } from '../../core/services/localization.service';

@Pipe({
  name: 'configLabel',
  pure: false,
  standalone: true,
})
export class ConfigLabelPipe implements PipeTransform {
  private readonly localization = inject(LocalizationService);

  transform(
    value: LocalizedConfigLabel | string | null | undefined,
    options?: readonly LocalizedConfigLabel[] | null,
  ): string {
    if (typeof value === 'string' && options) {
      return this.localization.configLabelForValue(value, options);
    }

    return this.localization.configLabel(value);
  }
}
