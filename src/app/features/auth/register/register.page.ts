import { NgIf } from '@angular/common';
import { Component, NgZone, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonicModule, LoadingController, NavController } from '@ionic/angular';

import { AuthService } from '../../../core/services/auth.service';
import { LocalizationService } from '../../../core/services/localization.service';
import { TranslationKey } from '../../../core/services/localization.translations';
import { WellnessHeaderComponent } from '../../../shared/components/wellness-header/wellness-header.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [IonicModule, NgIf, ReactiveFormsModule, RouterLink, TranslatePipe, WellnessHeaderComponent],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly ngZone = inject(NgZone);
  private readonly loadingController = inject(LoadingController);
  private readonly localization = inject(LocalizationService);
  private readonly navController = inject(NavController);

  isLoading = false;
  errorMessageKey: TranslationKey | '' = '';
  readonly canUseGoogleSignIn = this.authService.canUseGoogleSignIn;

  readonly form = new FormGroup({
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });

  async onRegisterButtonClick(): Promise<void> {
    console.log('[RegisterPage] register clicked');
    await this.submit();
  }

  async submit(): Promise<void> {
    console.log('[RegisterPage] form submitted');

    if (this.isLoading) {
      console.log('[RegisterPage] submit ignored because auth is already loading');
      return;
    }

    if (this.form.invalid) {
      console.log('[RegisterPage] form invalid', this.form.value);
      this.form.markAllAsTouched();
      this.errorMessageKey = 'auth.error.invalidRegisterForm';
      return;
    }

    const { displayName, email, password } = this.form.getRawValue();
    await this.runAuthAction('email register', () => this.authService.register({ email, password }, displayName));
  }

  async signInWithGoogle(): Promise<void> {
    console.log('[RegisterPage] Google button clicked');
    await this.runAuthAction('google login', () => this.authService.signInWithGoogle());
  }

  private async runAuthAction(label: string, action: () => Promise<unknown>): Promise<void> {
    this.errorMessageKey = '';
    this.isLoading = true;

    try {
      console.log(`[RegisterPage] auth action started: ${label}`);
      await action();
      console.log(`[RegisterPage] auth success: ${label}`);
      await this.completeSuccessfulAuth();
    } catch (error) {
      if (this.authService.isAuthCancellation(error)) {
        console.log(`[RegisterPage] auth action cancelled: ${label}`);
        return;
      }

      console.error(`[RegisterPage] auth error: ${label}`, error);
      this.errorMessageKey = this.authService.getErrorTranslationKey(error);
    } finally {
      this.isLoading = false;
    }
  }

  private async navigateHome(): Promise<void> {
    console.log('[RegisterPage] navigating to tabs home');
    await this.ngZone.run(() =>
      this.navController.navigateRoot('/tabs/home', {
        animated: true,
        animationDirection: 'forward',
      }),
    );
    console.log('[RegisterPage] navigation complete');
  }

  private async completeSuccessfulAuth(): Promise<void> {
    const transition = await this.presentAuthTransition();

    try {
      await this.delay(180);
      await this.navigateHome();
      await this.delay(260);
    } finally {
      await transition.dismiss();
    }
  }

  private async presentAuthTransition(): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingController.create({
      cssClass: 'auth-transition-loading',
      message: this.localization.translate('auth.signingIn'),
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
