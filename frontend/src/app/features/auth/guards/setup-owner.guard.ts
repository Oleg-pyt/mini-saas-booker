import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, of } from 'rxjs';

import { AuthFacade } from '../auth.facade';

export const setupOwnerGuard: CanActivateFn = (_route, state) => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  authFacade.initializeFromStorage();

  if (!authFacade.snapshot.token) {
    return of(router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } }));
  }

  const user = authFacade.snapshot.user;
  if (user) {
    return of(user.role === 'BUSINESS_OWNER' ? true : router.createUrlTree(['/']));
  }

  return authFacade.validateToken().pipe(
    map((isValid) => {
      if (!isValid) {
        return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
      }

      return authFacade.snapshot.user?.role === 'BUSINESS_OWNER'
        ? true
        : router.createUrlTree(['/']);
    })
  );
};