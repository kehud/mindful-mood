import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticatedSnapshot) {
    console.log('[AuthGuard] authenticated from Firebase currentUser snapshot');
    return true;
  }

  return authService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) => {
      console.log('[AuthGuard] authenticated from authState', isAuthenticated);
      return isAuthenticated || router.createUrlTree(['/welcome']);
    }),
  );
};
