import { Pipe, PipeTransform, inject } from '@angular/core';

import { LocalizationService } from '../../core/services/localization.service';
import { TranslationKey } from '../../core/services/localization.translations';

@Pipe({
  name: 't',
  pure: false,
  standalone: true,
})
export class TranslatePipe implements PipeTransform {
  private readonly localization = inject(LocalizationService);

  transform(key: TranslationKey | string, params?: Record<string, string | number>): string {
    return this.localization.translate(key, params);
  }
}
