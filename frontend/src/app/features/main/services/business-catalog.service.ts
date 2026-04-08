import { Inject, Injectable } from '@angular/core';
import { CatalogService as GeneratedCatalogService } from '@benatti/api';
import { map, Observable } from 'rxjs';

import { Business, ServiceOffering, TimeSlot } from '../models/business.model';

@Injectable({ providedIn: 'root' })
export class BusinessCatalogService {
  constructor(@Inject(GeneratedCatalogService) private readonly api: GeneratedCatalogService) {}

  getBusinesses(): Observable<Business[]> {
    return this.api.getBusinesses().pipe(
      map((businesses) => businesses.map((business) => this.mapSummaryToBusiness(business)))
    );
  }

  getBusinessById(id: string): Observable<Business> {
    return this.api.getBusinessById(id).pipe(
      map((business) => ({
        id: business.id,
        type: business.type,
        name: business.name,
        city: business.city,
        rating: business.rating,
        reviewsCount: business.reviewsCount,
        coverImageUrl: business.coverImageUrl,
        description: business.description,
        address: business.address,
        priceFrom: business.priceFrom,
        nextAvailableSlot: this.mapTimeSlot(business.nextAvailableSlot),
        services: business.services.map((service) => this.mapService(service))
      }))
    );
  }

  getAvailableSlots(businessId: string, serviceId: string): Observable<TimeSlot[]> {
    return this.api.getAvailableSlots(businessId, serviceId).pipe(
      map((slots) => slots.map((slot) => this.mapTimeSlot(slot)))
    );
  }

  getBusinessTypes(businesses: Business[]): string[] {
    return [...new Set(businesses.map((business) => business.type))].sort();
  }

  getCities(businesses: Business[]): string[] {
    return [...new Set(businesses.map((business) => business.city))].sort();
  }

  private mapSummaryToBusiness(business: {
    id: string;
    type: string;
    name: string;
    city: string;
    rating: number;
    reviewsCount: number;
    coverImageUrl: string;
    priceFrom: number;
    nextAvailableSlot: { id: string; label: string; startAt: string };
  }): Business {
    return {
      id: business.id,
      type: business.type,
      name: business.name,
      city: business.city,
      rating: business.rating,
      reviewsCount: business.reviewsCount,
      coverImageUrl: business.coverImageUrl,
      description: '',
      address: '',
      priceFrom: business.priceFrom,
      nextAvailableSlot: this.mapTimeSlot(business.nextAvailableSlot),
      services: []
    };
  }

  private mapService(service: {
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
    price: number;
    isActive: boolean;
  }): ServiceOffering {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      price: service.price,
      isActive: service.isActive
    };
  }

  private mapTimeSlot(slot: { id: string; label: string; startAt: string }): TimeSlot {
    return {
      id: slot.id,
      label: slot.label,
      startAt: slot.startAt
    };
  }
}
