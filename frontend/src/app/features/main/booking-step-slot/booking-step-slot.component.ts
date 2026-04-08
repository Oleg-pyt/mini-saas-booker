import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { TimeSlot } from '../models/business.model';

@Component({
  selector: 'app-booking-step-slot',
  templateUrl: './booking-step-slot.component.html',
  styleUrls: ['./booking-step-slot.component.scss'],
  standalone: false
})
export class BookingStepSlotComponent {
  @Input() slots: TimeSlot[] = [];
  @Input() selectedSlotId: string | null = null;
  @Input() isLoading = false;

  @Output() slotSelected = new EventEmitter<string>();
  @Output() continueClicked = new EventEmitter<void>();

  protected onSlotChanged(event: Event): void {
    const slotId = (event.target as HTMLInputElement).value;
    this.slotSelected.emit(slotId);
  }

  protected onContinue(): void {
    this.continueClicked.emit();
  }
}
