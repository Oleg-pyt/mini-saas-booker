import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import { ServiceOffering, TimeSlot } from '../models/business.model';

@Component({
  selector: 'app-booking-step-service',
  templateUrl: './booking-step-service.component.html',
  styleUrls: ['./booking-step-service.component.scss'],
  standalone: false
})
export class BookingStepServiceComponent {
  @Input() services: ServiceOffering[] = [];
  @Input() selectedServiceId: string | null = null;
  @Input() slots: TimeSlot[] = [];
  @Input() selectedSlotId: string | null = null;
  @Input() isLoadingSlots = false;

  @Output() serviceSelected = new EventEmitter<string>();
  @Output() slotSelected = new EventEmitter<string>();
  @Output() continueClicked = new EventEmitter<void>();

  protected selectedDayKey = '';
  protected visibleMonth = this.getMonthStart(new Date());

  protected get monthLabel(): string {
    return this.visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  protected get calendarCells(): Array<{ dayKey: string; dayNumber: number; isInCurrentMonth: boolean; hasSlots: boolean }> {
    const firstDayOfMonth = this.getMonthStart(this.visibleMonth);
    const gridStart = new Date(firstDayOfMonth);
    const dayOffset = (firstDayOfMonth.getDay() + 6) % 7;
    gridStart.setDate(firstDayOfMonth.getDate() - dayOffset);
    const slotDays = new Set(this.slots.map((slot) => this.toDayKey(slot.startAt)));
    const cells: Array<{ dayKey: string; dayNumber: number; isInCurrentMonth: boolean; hasSlots: boolean }> = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      const dayKey = this.toDayKey(date.toISOString());
      cells.push({
        dayKey,
        dayNumber: date.getDate(),
        isInCurrentMonth: date.getMonth() === this.visibleMonth.getMonth() && date.getFullYear() === this.visibleMonth.getFullYear(),
        hasSlots: slotDays.has(dayKey)
      });
    }

    return cells;
  }

  protected get selectedDaySlots(): TimeSlot[] {
    if (!this.selectedDayKey) {
      return [];
    }
    return this.slots
      .filter((slot) => this.toDayKey(slot.startAt) === this.selectedDayKey)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['slots']) {
      const availableDays = [...new Set(this.slots.map((slot) => this.toDayKey(slot.startAt)))].sort();
      if (!availableDays.length) {
        this.selectedDayKey = '';
        return;
      }

      if (!this.selectedDayKey || !availableDays.includes(this.selectedDayKey)) {
        this.selectedDayKey = availableDays[0];
      }

      const selectedDate = new Date(this.selectedDayKey + 'T00:00:00');
      this.visibleMonth = this.getMonthStart(selectedDate);
    }
  }

  protected onServiceChanged(event: Event): void {
    this.serviceSelected.emit((event.target as HTMLInputElement).value);
  }

  protected onSlotChanged(event: Event): void {
    this.slotSelected.emit((event.target as HTMLInputElement).value);
  }

  protected selectDay(dayKey: string): void {
    this.selectedDayKey = dayKey;
  }

  protected previousMonth(): void {
    this.visibleMonth = new Date(this.visibleMonth.getFullYear(), this.visibleMonth.getMonth() - 1, 1);
  }

  protected nextMonth(): void {
    this.visibleMonth = new Date(this.visibleMonth.getFullYear(), this.visibleMonth.getMonth() + 1, 1);
  }

  protected formatSlotTime(isoDate: string): string {
    return new Date(isoDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  protected onContinue(): void {
    this.continueClicked.emit();
  }

  private toDayKey(isoDate: string): string {
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
}