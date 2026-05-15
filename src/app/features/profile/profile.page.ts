import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, NgZone, inject } from '@angular/core';
import { IonicModule, LoadingController, NavController } from '@ionic/angular';

import { AuthService } from '../../core/services/auth.service';
import { AppLanguage, LocalizationService } from '../../core/services/localization.service';
import { ThemeService } from '../../core/services/theme.service';
import { WellnessCardComponent } from '../../shared/components/wellness-card/wellness-card.component';
import { WellnessHeaderComponent } from '../../shared/components/wellness-header/wellness-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [AsyncPipe, IonicModule, NgFor, NgIf, TranslatePipe, WellnessCardComponent, WellnessHeaderComponent],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage {
  private readonly authService = inject(AuthService);
  protected readonly localization = inject(LocalizationService);
  private readonly loadingController = inject(LoadingController);
  private readonly navController = inject(NavController);
  private readonly ngZone = inject(NgZone);
  private readonly themeService = inject(ThemeService);

  readonly user$ = this.authService.currentUser$;
  readonly languageOptions = this.localization.availableLanguages;
  readonly currentLanguage = this.localization.currentLanguage;
  readonly isLanguageSwitching = this.localization.isSwitchingLanguage;
  readonly themeOptions = this.themeService.themeOptions;
  readonly themePreference$ = this.themeService.preference$;
  readonly resolvedTheme$ = this.themeService.resolvedTheme$;
  isSigningOut = false;
  errorMessage = '';

  setTheme(value: unknown): void {
    if (this.themeService.isThemePreference(value)) {
      this.themeService.setPreference(value);
    }
  }

  async setLanguage(value: unknown): Promise<void> {
    if (this.isAppLanguage(value)) {
      await this.localization.switchLanguage(value);
    }
  }

  languageLabel(language: AppLanguage): string {
    const option = this.languageOptions.find((item) => item.code === language);

    return option?.nativeLabel ?? language;
  }

  themeLabel(value: string): string {
    return this.localization.translate(`theme.${value}`);
  }

  async signOut(): Promise<void> {
    this.errorMessage = '';
    this.isSigningOut = true;
    const transition = await this.presentSignOutTransition();

    try {
      await this.authService.signOut();
      await this.delay(160);
      await this.ngZone.run(() =>
        this.navController.navigateRoot('/welcome', {
          animated: true,
          animationDirection: 'back',
          replaceUrl: true,
        }),
      );
      await this.delay(220);
    } catch (error) {
      this.errorMessage = this.authService.getErrorMessage(error);
    } finally {
      await transition.dismiss();
      this.isSigningOut = false;
    }
  }

  private isAppLanguage(value: unknown): value is AppLanguage {
    return value === 'en' || value === 'he';
  }

  private async presentSignOutTransition(): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingController.create({
      cssClass: 'auth-transition-loading',
      message: this.localization.translate('profile.signingOut'),
      spinner: 'crescent',
      translucent: true,
    });

    await loading.present();
    return loading;
  }

  private async delay(durationMs: number): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, durationMs);
    });
  }
}
