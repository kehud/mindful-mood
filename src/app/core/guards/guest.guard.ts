import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticatedSnapshot) {
    console.log('[GuestGuard] authenticated from Firebase currentUser snapshot; redirecting home');
    return router.createUrlTree(['/tabs/home']);
  }

  return authService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) => {
      console.log('[GuestGuard] authenticated from authState', isAuthenticated);
      return !isAuthenticated || router.createUrlTree(['/tabs/home']);
    }),
  );
};
