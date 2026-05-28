import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [AsyncPipe, IonicModule, RouterLink, TranslatePipe],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  private readonly authService = inject(AuthService);

  readonly currentUser$ = this.authService.currentUser$;

  get greetingTranslationKey(): string {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return 'home.greeting.morning';
    }

    if (hour >= 12 && hour < 17) {
      return 'home.greeting.afternoon';
    }

    if (hour >= 17 && hour < 21) {
      return 'home.greeting.evening';
    }

    return 'home.greeting.night';
  }

  nameLead(displayName: string | null | undefined): string {
    return this.normalizedName(displayName).slice(0, 1);
  }

  nameRest(displayName: string | null | undefined): string {
    return this.normalizedName(displayName).slice(1);
  }

  private normalizedName(displayName: string | null | undefined): string {
    return displayName?.trim() ?? '';
  }
}
