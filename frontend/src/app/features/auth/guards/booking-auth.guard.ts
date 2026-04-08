import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, of } from 'rxjs';

import { AuthFacade } from '../auth.facade';

export const bookingAuthGuard: CanActivateFn = (_route, state) => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  authFacade.initializeFromStorage();

  if (!authFacade.snapshot.token) {
    return of(router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } }));
  }

  if (authFacade.snapshot.user) {
    return of(true);
  }

  return authFacade.validateToken().pipe(
    map((isValid) =>
      isValid ? true : router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } })
    )
  );
};
