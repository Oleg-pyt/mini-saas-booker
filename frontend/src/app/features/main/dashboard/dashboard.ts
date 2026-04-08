import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { Business, BusinessFilters } from '../models/business.model';
import { BusinessCatalogService } from '../services/business-catalog.service';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  standalone: false,
})
export class DashboardComponent implements OnInit, OnDestroy {
  protected businessTypes: string[] = [];
  protected cities: string[] = [];
  protected isLoading = true;
  protected error: string | null = null;

  protected readonly filters: BusinessFilters = {
    selectedType: '',
    selectedCity: '',
    searchTerm: '',
    minimumRating: 0
  };

  private businesses: Business[] = [];
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly catalog: BusinessCatalogService) {
    
  }

  ngOnInit(): void {
    this.catalog.getBusinesses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (businesses) => {
          this.businesses = businesses;
          this.businessTypes = this.catalog.getBusinessTypes(businesses);
          this.cities = this.catalog.getCities(businesses);
          this.isLoading = false;
          console.log('Loaded businesses:', businesses);
        },
        error: () => {
          this.error = 'Could not load businesses right now.';
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected get filteredBusinesses(): Business[] {
    const normalizedSearch = this.filters.searchTerm.trim().toLowerCase();

    return this.businesses.filter((business) => {
      const typeMatches = !this.filters.selectedType || business.type === this.filters.selectedType;
      const cityMatches = !this.filters.selectedCity || business.city === this.filters.selectedCity;
      const ratingMatches = business.rating >= this.filters.minimumRating;
      const searchMatches = !normalizedSearch || business.name.toLowerCase().includes(normalizedSearch);

      return typeMatches && cityMatches && ratingMatches && searchMatches;
    });
  }

  protected onTypeChanged(value: string): void {
    this.filters.selectedType = value;
  }

  protected onCityChanged(value: string): void {
    this.filters.selectedCity = value;
  }

  protected onSearchChanged(value: string): void {
    this.filters.searchTerm = value;
  }

  protected onMinimumRatingChanged(value: number): void {
    this.filters.minimumRating = value;
  }
}
