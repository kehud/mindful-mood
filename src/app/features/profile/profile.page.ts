import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

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
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  readonly user$ = this.authService.currentUser$;
  readonly languageOptions = this.localization.availableLanguages;
  readonly currentLanguage = this.localization.currentLanguage;
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

  setLanguage(value: unknown): void {
    if (this.isAppLanguage(value)) {
      this.localization.setLanguage(value);
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

    try {
      await this.authService.signOut();
      await this.router.navigateByUrl('/welcome');
    } catch (error) {
      this.errorMessage = this.authService.getErrorMessage(error);
    } finally {
      this.isSigningOut = false;
    }
  }

  private isAppLanguage(value: unknown): value is AppLanguage {
    return value === 'en' || value === 'he';
  }
}
