import { NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { AuthService } from '../../../core/services/auth.service';
import { WellnessHeaderComponent } from '../../../shared/components/wellness-header/wellness-header.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonicModule, NgIf, ReactiveFormsModule, RouterLink, WellnessHeaderComponent],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoading = false;
  errorMessage = '';

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });

  async onLoginButtonClick(): Promise<void> {
    console.log('[LoginPage] button clicked');
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
      this.errorMessage = 'Please enter a valid email and password.';
      return;
    }

    await this.runAuthAction('email login', () => this.authService.login(this.form.getRawValue()));
  }

  async signInWithGoogle(): Promise<void> {
    console.log('[LoginPage] Google button clicked');
    await this.runAuthAction('google login', () => this.authService.signInWithGoogle());
  }

  private async runAuthAction(label: string, action: () => Promise<unknown>): Promise<void> {
    this.errorMessage = '';
    this.isLoading = true;

    try {
      console.log(`[LoginPage] auth action started: ${label}`);
      await action();
      console.log(`[LoginPage] auth success: ${label}`);
      await this.router.navigateByUrl('/tabs/home');
    } catch (error) {
      console.error(`[LoginPage] auth error: ${label}`, error);
      this.errorMessage = this.authService.getErrorMessage(error);
    } finally {
      this.isLoading = false;
    }
  }
}
