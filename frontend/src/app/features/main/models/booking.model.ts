import { ServiceOffering, TimeSlot } from './business.model';

export interface BookingRequest {
  businessId: string;
  serviceId: string;
  startAt: string;
  notes?: string;
}

export interface BookingConfirmation {
  confirmationId: string;
  businessId: string;
  businessName: string;
  serviceName: string;
  slotLabel: string;
  clientName: string;
}

export interface BookingWizardState {
  businessId: string | null;
  businessName: string;
  services: ServiceOffering[];
  selectedServiceId: string | null;
  availableSlots: TimeSlot[];
  selectedSlotId: string | null;
  notes: string;
  step: 1 | 2;
  isLoadingSlots: boolean;
  isSubmitting: boolean;
  error: string | null;
}

export type BookingWizardAction =
  | { type: 'Init'; businessId: string; businessName: string; services: ServiceOffering[] }
  | { type: 'SelectService'; serviceId: string }
  | { type: 'SetSlots'; slots: TimeSlot[] }
  | { type: 'SelectSlot'; slotId: string }
  | { type: 'SetNotes'; notes: string }
  | { type: 'SetStep'; step: 1 | 2 }
  | { type: 'SetLoadingSlots'; isLoadingSlots: boolean }
  | { type: 'SetSubmitting'; isSubmitting: boolean }
  | { type: 'SetError'; error: string | null }
  | { type: 'Reset' };
