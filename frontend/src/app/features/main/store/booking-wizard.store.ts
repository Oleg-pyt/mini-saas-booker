import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';

import { BookingWizardAction, BookingWizardState } from '../models/booking.model';
import { ServiceOffering, TimeSlot } from '../models/business.model';

const initialState: BookingWizardState = {
  businessId: null,
  businessName: '',
  services: [],
  selectedServiceId: null,
  availableSlots: [],
  selectedSlotId: null,
  notes: '',
  step: 1,
  isLoadingSlots: false,
  isSubmitting: false,
  error: null
};

@Injectable()
export class BookingWizardStore {
  private readonly stateSubject = new BehaviorSubject<BookingWizardState>(initialState);

  readonly state$: Observable<BookingWizardState> = this.stateSubject.asObservable();
  readonly selectedService$: Observable<ServiceOffering | null> = this.state$.pipe(
    map((state) => state.services.find((service) => service.id === state.selectedServiceId) ?? null)
  );
  readonly selectedSlot$: Observable<TimeSlot | null> = this.state$.pipe(
    map((state) => state.availableSlots.find((slot) => slot.id === state.selectedSlotId) ?? null)
  );

  get snapshot(): BookingWizardState {
    return this.stateSubject.value;
  }

  dispatch(action: BookingWizardAction): void {
    const nextState = reducer(this.stateSubject.value, action);
    this.stateSubject.next(nextState);
  }
}

function reducer(state: BookingWizardState, action: BookingWizardAction): BookingWizardState {
  switch (action.type) {
    case 'Init':
      return {
        ...state,
        businessId: action.businessId,
        businessName: action.businessName,
        services: action.services,
        selectedServiceId: null,
        availableSlots: [],
        selectedSlotId: null,
        notes: '',
        step: 1,
        isLoadingSlots: false,
        isSubmitting: false,
        error: null
      };
    case 'SelectService':
      return {
        ...state,
        selectedServiceId: action.serviceId,
        availableSlots: [],
        selectedSlotId: null,
        error: null
      };
    case 'SetSlots':
      return {
        ...state,
        availableSlots: action.slots,
        selectedSlotId: action.slots.some((slot) => slot.id === state.selectedSlotId) ? state.selectedSlotId : null
      };
    case 'SelectSlot':
      return { ...state, selectedSlotId: action.slotId };
    case 'SetNotes':
      return { ...state, notes: action.notes };
    case 'SetStep':
      return { ...state, step: action.step, error: null };
    case 'SetLoadingSlots':
      return { ...state, isLoadingSlots: action.isLoadingSlots };
    case 'SetSubmitting':
      return { ...state, isSubmitting: action.isSubmitting };
    case 'SetError':
      return { ...state, error: action.error };
    case 'Reset':
      return initialState;
    default:
      return state;
  }
}
