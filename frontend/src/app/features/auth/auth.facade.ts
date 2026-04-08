import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, of, tap } from 'rxjs';

import { AuthService as AuthApiService, LoginRequest, RegisterRequest } from '@benatti/api';
import { ToastService } from '../../common/toast/toast.service';
import { AuthStore } from './store/auth.store';

const TOKEN_KEY = 'booker_access_token';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  constructor(
    private readonly api: AuthApiService,
    private readonly authStore: AuthStore,
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {}

  get state$() {
    return this.authStore.state$;
  }

  get snapshot() {
    return this.authStore.snapshot;
  }

  initializeFromStorage(): void {
    this.authStore.dispatch({ type: 'LoadFromStorage', token: localStorage.getItem(TOKEN_KEY) });
  }

  validateToken() {
    const token = this.getAccessToken();
    if (!token) {
      this.authStore.dispatch({ type: 'Logout' });
      return of(false);
    }

    this.authStore.dispatch({ type: 'AuthStart' });

    return this.api.validateToken().pipe(
      tap((user) => {
        this.authStore.dispatch({ type: 'AuthSuccess', token, user });
      }),
      map(() => true),
      catchError(() => {
        this.clearSession(false);
        return of(false);
      })
    );
  }

  login(payload: LoginRequest, redirectTo = '/') {
    this.authStore.dispatch({ type: 'AuthStart' });

    return this.api.login(payload).pipe(
      tap((response) => {
        localStorage.setItem(TOKEN_KEY, response.accessToken);
        this.authStore.dispatch({ type: 'AuthSuccess', token: response.accessToken, user: response.user });
        this.toastService.success(`Welcome back, ${response.user.name}`);
      }),
      tap(() => this.router.navigateByUrl(redirectTo)),
      map(() => true),
      catchError((error) => {
        const message = error?.status === 401 ? 'Invalid login or password.' : 'Login failed.';
        this.authStore.dispatch({ type: 'AuthFailure', error: message });
        return of(false);
      })
    );
  }

  register(payload: RegisterRequest, redirectTo = '/') {
    this.authStore.dispatch({ type: 'AuthStart' });

    return this.api.register(payload).pipe(
      tap((response) => {
        localStorage.setItem(TOKEN_KEY, response.accessToken);
        this.authStore.dispatch({ type: 'AuthSuccess', token: response.accessToken, user: response.user });
        this.toastService.success(`Account created. Welcome, ${response.user.name}`);
      }),
      tap(() => this.router.navigateByUrl(redirectTo)),
      map(() => true),
      catchError((error) => {
        const message = error?.status === 409 ? 'Login or email already exists.' : 'Registration failed.';
        this.authStore.dispatch({ type: 'AuthFailure', error: message });
        return of(false);
      })
    );
  }

  logout(): void {
    this.api
      .logout()
      .pipe(catchError(() => of(null)))
      .subscribe(() => this.clearSession(true));
  }

  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private clearSession(withToast: boolean): void {
    localStorage.removeItem(TOKEN_KEY);
    this.authStore.dispatch({ type: 'Logout' });
    if (withToast) {
      this.toastService.show('Signed out', 'info');
    }
    this.router.navigate(['/auth/login']);
  }
}
