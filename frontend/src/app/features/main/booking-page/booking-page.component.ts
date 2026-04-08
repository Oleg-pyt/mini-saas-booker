import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { BookingApiService } from '../services/booking-api.service';
import { BusinessCatalogService } from '../services/business-catalog.service';
import { ToastService } from '../../../common/toast/toast.service';
import { BookingWizardStore } from '../store/booking-wizard.store';
import { AuthFacade } from '../../auth/auth.facade';
import { Business } from '../models/business.model';

@Component({
  selector: 'app-booking-page',
  templateUrl: './booking-page.component.html',
  styleUrls: ['./booking-page.component.scss'],
  standalone: false,
  providers: [BookingWizardStore]
})
export class BookingPageComponent implements OnInit, OnDestroy {
  protected business: Business | undefined;
  protected isLoading = true;
  protected customerName = 'Authenticated customer';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly catalog: BusinessCatalogService,
    private readonly bookingApi: BookingApiService,
    private readonly authFacade: AuthFacade,
    private readonly toastService: ToastService,
    private readonly store: BookingWizardStore
  ) {}

  protected get state$() {
    return this.store.state$;
  }

  protected get selectedSlot$() {
    return this.store.selectedSlot$;
  }

  protected get selectedService$() {
    return this.store.selectedService$;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/']);
      return;
    }

    this.customerName = this.authFacade.snapshot.user?.name ?? 'Authenticated customer';

    this.catalog.getBusinessById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (business) => {
          this.business = business;
          this.store.dispatch({
            type: 'Init',
            businessId: business.id,
            businessName: business.name,
            services: business.services.filter((service) => service.isActive)
          });
          this.isLoading = false;
        },
        error: () => {
          this.router.navigate(['/']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onServiceSelected(serviceId: string): void {
    const state = this.store.snapshot;
    if (!state.businessId) {
      return;
    }

    const previousSelectedStartAt = state.availableSlots.find((slot) => slot.id === state.selectedSlotId)?.startAt;

    this.store.dispatch({ type: 'SelectService', serviceId });
    this.store.dispatch({ type: 'SetLoadingSlots', isLoadingSlots: true });
    this.store.dispatch({ type: 'SetError', error: null });

    this.catalog.getAvailableSlots(state.businessId, serviceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (slots) => {
          this.store.dispatch({ type: 'SetSlots', slots });
          if (previousSelectedStartAt) {
            const sameTimeSlot = slots.find((slot) => slot.startAt === previousSelectedStartAt);
            if (sameTimeSlot) {
              this.store.dispatch({ type: 'SelectSlot', slotId: sameTimeSlot.id });
            }
          }
          this.store.dispatch({ type: 'SetLoadingSlots', isLoadingSlots: false });
        },
        error: () => {
          this.store.dispatch({ type: 'SetLoadingSlots', isLoadingSlots: false });
          this.store.dispatch({ type: 'SetError', error: 'Could not calculate slots for this service.' });
        }
      });
  }

  protected continueFromSelection(): void {
    const state = this.store.snapshot;

    if (!state.selectedServiceId) {
      this.store.dispatch({ type: 'SetError', error: 'Please select a service.' });
      return;
    }

    if (!state.selectedSlotId) {
      this.store.dispatch({ type: 'SetError', error: 'Please select an available slot.' });
      return;
    }

    this.store.dispatch({ type: 'SetStep', step: 2 });
  }

  protected onSlotSelected(slotId: string): void {
    this.store.dispatch({ type: 'SelectSlot', slotId });
  }

  protected backToSelection(): void {
    this.store.dispatch({ type: 'SetStep', step: 1 });
  }

  protected onNotesChanged(notes: string): void {
    this.store.dispatch({ type: 'SetNotes', notes });
  }

  protected confirmBooking(): void {
    const state = this.store.snapshot;
    const business = this.business;

    if (!business || !state.businessId || !state.selectedServiceId || !state.selectedSlotId) {
      this.store.dispatch({ type: 'SetError', error: 'Booking state is incomplete.' });
      return;
    }

    const selectedService = state.services.find((service) => service.id === state.selectedServiceId);
    const slot = state.availableSlots.find((item) => item.id === state.selectedSlotId);
    if (!selectedService) {
      this.store.dispatch({ type: 'SetError', error: 'Selected service not found.' });
      return;
    }

    if (!slot) {
      this.store.dispatch({ type: 'SetError', error: 'Selected slot not found.' });
      return;
    }

    this.store.dispatch({ type: 'SetSubmitting', isSubmitting: true });
    this.store.dispatch({ type: 'SetError', error: null });

    this.bookingApi
      .submitBooking(
        {
          businessId: state.businessId,
          serviceId: state.selectedServiceId,
          startAt: slot.startAt,
          notes: state.notes.trim() || undefined
        }
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.store.dispatch({ type: 'SetSubmitting', isSubmitting: false });
          this.toastService.success(
            `Booked ${response.businessName} · ${response.serviceName} for ${response.slotLabel}. Confirmation: ${response.confirmationId}`
          );
          this.router.navigate(['/']);
        },
        error: () => {
          this.store.dispatch({ type: 'SetSubmitting', isSubmitting: false });
          this.store.dispatch({ type: 'SetError', error: 'Could not submit booking. The slot may no longer be available.' });
        }
      });
  }
}
