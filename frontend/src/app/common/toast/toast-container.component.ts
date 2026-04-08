import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastContainerComponent {
  constructor(private readonly toastService: ToastService) {}

  protected get toasts$() {
    return this.toastService.toasts$;
  }

  protected dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
