import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { TimeSlot } from '../models/business.model';

@Component({
  selector: 'app-booking-step-review',
  templateUrl: './booking-step-review.component.html',
  styleUrls: ['./booking-step-review.component.scss'],
  standalone: false
})
export class BookingStepReviewComponent {
  @Input() businessName = '';
  @Input() businessAddress = '';
  @Input() serviceName = '';
  @Input() servicePrice = 0;
  @Input() customerName = '';
  @Input() notes = '';
  @Input() selectedSlot: TimeSlot | null = null;
  @Input() isSubmitting = false;

  @Output() backClicked = new EventEmitter<void>();
  @Output() notesChanged = new EventEmitter<string>();
  @Output() confirmClicked = new EventEmitter<void>();

  protected onBack(): void {
    this.backClicked.emit();
  }

  protected onNotesChanged(event: Event): void {
    this.notesChanged.emit((event.target as HTMLTextAreaElement).value);
  }

  protected onConfirm(): void {
    this.confirmClicked.emit();
  }
}
