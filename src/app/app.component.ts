import { ApplicationRef, Component, NgZone, inject } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { filter, firstValueFrom, of, take, timeout } from 'rxjs';

import { LocalizationService } from './core/services/localization.service';
import { ThemeService } from './core/services/theme.service';

const SPLASH_VISIBLE_MS = 2500;
const SPLASH_FADE_MS = 300;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  private readonly appRef = inject(ApplicationRef);
  private readonly ngZone = inject(NgZone);
  private readonly themeService = inject(ThemeService);
  protected readonly localization = inject(LocalizationService);

  constructor() {
    this.ngZone.runOutsideAngular(() => {
      void this.hideSplashAfterStartup();
    });
  }

  private async hideSplashAfterStartup(): Promise<void> {
    await Promise.all([
      this.delay(SPLASH_VISIBLE_MS),
      this.waitForInitialRender(),
    ]);

    try {
      await SplashScreen.hide({ fadeOutDuration: SPLASH_FADE_MS });
    } catch {
      // Splash timing should never block app startup if the native plugin is unavailable.
    }
  }

  private async waitForInitialRender(): Promise<void> {
    await firstValueFrom(
      this.appRef.isStable.pipe(
        filter(Boolean),
        take(1),
        timeout({ first: SPLASH_VISIBLE_MS, with: () => of(true) }),
      ),
    );
  }

  private async delay(durationMs: number): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, durationMs);
    });
  }
}
