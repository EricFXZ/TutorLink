import { effect, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If auth state is not initialized, wait for it
  if (!authService.authInitialized()) {
    await new Promise<void>(resolve => {
      const watcher = effect(() => {
          if (authService.authInitialized()) {
              watcher.destroy();
              resolve();
          }
      });
    });
  }
  
  // After initialization, check user
  if (authService.currentUser()) {
    return true;
  }
  
  // Redirect to login if not authenticated
  return router.createUrlTree(['/login']);
};
