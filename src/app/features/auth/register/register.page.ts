import { NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { AuthService } from '../../../core/services/auth.service';
import { WellnessHeaderComponent } from '../../../shared/components/wellness-header/wellness-header.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [IonicModule, NgIf, ReactiveFormsModule, RouterLink, WellnessHeaderComponent],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoading = false;
  errorMessage = '';

  readonly form = new FormGroup({
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });

  async onRegisterButtonClick(): Promise<void> {
    console.log('[RegisterPage] button clicked');
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
      this.errorMessage = 'Please enter your name, a valid email, and a password with at least 6 characters.';
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
    this.errorMessage = '';
    this.isLoading = true;

    try {
      console.log(`[RegisterPage] auth action started: ${label}`);
      await action();
      console.log(`[RegisterPage] auth success: ${label}`);
      await this.router.navigateByUrl('/tabs/home');
    } catch (error) {
      console.error(`[RegisterPage] auth error: ${label}`, error);
      this.errorMessage = this.authService.getErrorMessage(error);
    } finally {
      this.isLoading = false;
    }
  }
}
