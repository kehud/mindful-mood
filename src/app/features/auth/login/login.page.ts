import { NgIf } from '@angular/common';
import { Component, NgZone, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { AuthService } from '../../../core/services/auth.service';
import { TranslationKey } from '../../../core/services/localization.translations';
import { WellnessHeaderComponent } from '../../../shared/components/wellness-header/wellness-header.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonicModule, NgIf, ReactiveFormsModule, RouterLink, TranslatePipe, WellnessHeaderComponent],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  isLoading = false;
  errorMessageKey: TranslationKey | '' = '';
  readonly canUseGoogleSignIn = this.authService.canUseGoogleSignIn;

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });

  async onLoginButtonClick(): Promise<void> {
    console.log('[LoginPage] login clicked');
    await this.submit();
  }

  async submit(): Promise<void> {
    console.log('[LoginPage] form submitted');

    if (this.isLoading) {
      console.log('[LoginPage] submit ignored because auth is already loading');
      return;
    }

    if (this.form.invalid) {
      console.log('[LoginPage] form invalid', this.form.value);
      this.form.markAllAsTouched();
      this.errorMessageKey = 'auth.error.invalidLoginForm';
      return;
    }

    await this.runAuthAction('email login', () => this.authService.login(this.form.getRawValue()));
  }

  async signInWithGoogle(): Promise<void> {
    console.log('[LoginPage] Google button clicked');
    await this.runAuthAction('google login', () => this.authService.signInWithGoogle());
  }

  private async runAuthAction(label: string, action: () => Promise<unknown>): Promise<void> {
    this.errorMessageKey = '';
    this.isLoading = true;

    try {
      console.log(`[LoginPage] auth action started: ${label}`);
      await action();
      console.log(`[LoginPage] auth success: ${label}`);
      await this.navigateHome();
    } catch (error) {
      console.error(`[LoginPage] auth error: ${label}`, error);
      this.errorMessageKey = this.authService.getErrorTranslationKey(error);
    } finally {
      this.isLoading = false;
    }
  }

  private async navigateHome(): Promise<void> {
    console.log('[LoginPage] navigating to tabs home');
    await this.ngZone.run(() => this.router.navigateByUrl('/tabs/home', { replaceUrl: true }));
    console.log('[LoginPage] navigation complete');
  }
}
