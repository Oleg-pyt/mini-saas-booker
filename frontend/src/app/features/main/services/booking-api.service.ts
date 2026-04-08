import { Inject, Injectable } from '@angular/core';
import { BookingsService as GeneratedBookingsService } from '@benatti/api';
import { map, Observable } from 'rxjs';

import { BookingConfirmation, BookingRequest } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingApiService {
  constructor(@Inject(GeneratedBookingsService) private readonly api: GeneratedBookingsService) {}

  submitBooking(request: BookingRequest): Observable<BookingConfirmation> {
    return this.api.createBooking(request).pipe(
      map((response) => ({
        confirmationId: response.confirmationId,
        businessId: response.businessId,
        businessName: response.businessName,
        serviceName: response.serviceName,
        slotLabel: response.slotLabel,
        clientName: response.clientName
      }))
    );
  }
}
