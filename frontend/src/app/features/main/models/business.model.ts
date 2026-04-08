export interface TimeSlot {
  id: string;
  label: string;
  startAt: string;
}

export interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
}

export interface Business {
  id: string;
  type: string;
  name: string;
  city: string;
  rating: number;
  reviewsCount: number;
  coverImageUrl: string;
  description: string;
  address: string;
  priceFrom: number;
  nextAvailableSlot: TimeSlot;
  services: ServiceOffering[];
}

export interface BusinessFilters {
  selectedType: string;
  selectedCity: string;
  searchTerm: string;
  minimumRating: number;
}
