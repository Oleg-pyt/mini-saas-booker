import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { AuthUser } from '@benatti/api';

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
}

export type AuthAction =
  | { type: 'LoadFromStorage'; token: string | null }
  | { type: 'AuthStart' }
  | { type: 'AuthSuccess'; token: string; user: AuthUser }
  | { type: 'AuthFailure'; error: string }
  | { type: 'Logout' };

const initialState: AuthState = {
  token: null,
  user: null,
  isLoading: false,
  error: null
};

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly stateSubject = new BehaviorSubject<AuthState>(initialState);
  readonly state$: Observable<AuthState> = this.stateSubject.asObservable();

  get snapshot(): AuthState {
    return this.stateSubject.value;
  }

  dispatch(action: AuthAction): void {
    this.stateSubject.next(reducer(this.stateSubject.value, action));
  }
}

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LoadFromStorage':
      return { ...state, token: action.token, error: null };
    case 'AuthStart':
      return { ...state, isLoading: true, error: null };
    case 'AuthSuccess':
      return { ...state, token: action.token, user: action.user, isLoading: false, error: null };
    case 'AuthFailure':
      return { ...state, isLoading: false, error: action.error };
    case 'Logout':
      return { ...initialState };
    default:
      return state;
  }
}
