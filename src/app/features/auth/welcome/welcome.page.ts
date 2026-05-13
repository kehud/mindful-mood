import { NgIf } from '@angular/common';
import { Component, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonModal, IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { TranslationKey } from '../../../core/services/localization.translations';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

type AuthSheetMode = 'login' | 'register';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [IonicModule, NgIf, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
})
export class WelcomePage implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly authStateSubscription: Subscription = this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
    if (isAuthenticated && this.isAuthSheetOpen) {
      void this.closeAuthSheetAfterSuccess();
    }
  });

  @ViewChild('authSheetModal') private authSheetModal?: IonModal;

  readonly authSheetBreakpoints = [0, 0.76, 0.88, 0.94];
  readonly authSheetInitialBreakpoint = 0.88;
  readonly canDismissAuthSheet = async (): Promise<boolean> => !this.isLoading;
  readonly canUseGoogleSignIn = this.authService.canUseGoogleSignIn;

  authSheetMode: AuthSheetMode = 'register';
  errorMessageKey: TranslationKey | '' = '';
  isAuthSheetOpen = false;
  isLoading = false;

  readonly loginForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });

  readonly registerForm = new FormGroup({
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });

  ngOnDestroy(): void {
    this.authStateSubscription.unsubscribe();
  }

  openAuthSheet(mode: AuthSheetMode): void {
    this.authSheetMode = mode;
    this.errorMessageKey = '';
    this.isAuthSheetOpen = true;
  }

  onAuthSheetDidDismiss(): void {
    this.isAuthSheetOpen = false;
    this.isLoading = false;
    this.errorMessageKey = '';
  }

  switchAuthSheetMode(mode: AuthSheetMode): void {
    if (this.isLoading || this.authSheetMode === mode) {
      return;
    }

    this.syncEmailBetweenForms(mode);
    this.authSheetMode = mode;
    this.errorMessageKey = '';
  }

  async submitAuthSheet(): Promise<void> {
    if (this.authSheetMode === 'login') {
      await this.submitLogin();
      return;
    }

    await this.submitRegister();
  }

  async signInWithGoogle(): Promise<void> {
    await this.runAuthAction('google login', () => this.authService.signInWithGoogle());
  }

  private async submitLogin(): Promise<void> {
    if (this.isLoading) {
      return;
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessageKey = 'auth.error.invalidLoginForm';
      return;
    }

    await this.runAuthAction('email login', () => this.authService.login(this.loginForm.getRawValue()));
  }

  private async submitRegister(): Promise<void> {
    if (this.isLoading) {
      return;
    }

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.errorMessageKey = 'auth.error.invalidRegisterForm';
      return;
    }

    const { displayName, email, password } = this.registerForm.getRawValue();
    await this.runAuthAction('email register', () => this.authService.register({ email, password }, displayName));
  }

  private async runAuthAction(label: string, action: () => Promise<unknown>): Promise<void> {
    if (this.isLoading) {
      return;
    }

    this.errorMessageKey = '';
    this.isLoading = true;

    try {
      console.log(`[WelcomePage] auth action started: ${label}`);
      await action();
      console.log(`[WelcomePage] auth success: ${label}`);
      await this.closeAuthSheetAfterSuccess();
      await this.navigateHome();
    } catch (error) {
      console.error(`[WelcomePage] auth error: ${label}`, error);
      this.errorMessageKey = this.authService.getErrorTranslationKey(error);
    } finally {
      this.isLoading = false;
    }
  }

  private syncEmailBetweenForms(targetMode: AuthSheetMode): void {
    const sourceEmail =
      this.authSheetMode === 'login'
        ? this.loginForm.controls.email.value
        : this.registerForm.controls.email.value;

    if (!sourceEmail) {
      return;
    }

    const targetForm = targetMode === 'login' ? this.loginForm : this.registerForm;
    targetForm.controls.email.setValue(sourceEmail);
  }

  private async navigateHome(): Promise<void> {
    await this.ngZone.run(() => this.router.navigateByUrl('/tabs/home', { replaceUrl: true }));
  }

  private async closeAuthSheetAfterSuccess(): Promise<void> {
    this.errorMessageKey = '';
    this.isLoading = false;
    this.isAuthSheetOpen = false;

    try {
      await this.authSheetModal?.dismiss(undefined, 'auth-success');
    } catch {
      // The isOpen binding may already have dismissed the overlay.
    }
  }
}
