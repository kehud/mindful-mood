import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { AuthService } from '../../core/services/auth.service';
import { WellnessCardComponent } from '../../shared/components/wellness-card/wellness-card.component';
import { WellnessHeaderComponent } from '../../shared/components/wellness-header/wellness-header.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [AsyncPipe, IonicModule, NgIf, WellnessCardComponent, WellnessHeaderComponent],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly user$ = this.authService.currentUser$;
  isSigningOut = false;
  errorMessage = '';

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
}
