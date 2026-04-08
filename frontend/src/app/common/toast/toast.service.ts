import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { ToastMessage } from './toast.model';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  readonly toasts$ = this.toastsSubject.asObservable();

  success(message: string, durationMs = 3500): void {
    this.show(message, 'success', durationMs);
  }

  error(message: string, durationMs = 3500): void {
    this.show(message, 'error', durationMs);
  }
  

  show(message: string, variant: ToastMessage['variant'], durationMs = 3500): void {
    const toast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      message,
      variant
    };

    this.toastsSubject.next([...this.toastsSubject.value, toast]);

    setTimeout(() => {
      this.dismiss(toast.id);
    }, durationMs);
  }

  dismiss(id: string): void {
    this.toastsSubject.next(this.toastsSubject.value.filter((toast) => toast.id !== id));
  }
}
