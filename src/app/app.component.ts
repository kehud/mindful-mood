import { Component, inject } from '@angular/core';

import { LocalizationService } from './core/services/localization.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  private readonly themeService = inject(ThemeService);
  protected readonly localization = inject(LocalizationService);
}
