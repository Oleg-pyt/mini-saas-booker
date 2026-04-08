import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-business-filters',
  templateUrl: './business-filters.component.html',
  styleUrls: ['./business-filters.component.scss'],
  standalone: false
})
export class BusinessFiltersComponent {
  @Input() businessTypes: string[] = [];
  @Input() cities: string[] = [];
  @Input() selectedType = '';
  @Input() selectedCity = '';
  @Input() searchTerm = '';
  @Input() minimumRating = 0;

  @Output() selectedTypeChange = new EventEmitter<string>();
  @Output() selectedCityChange = new EventEmitter<string>();
  @Output() searchTermChange = new EventEmitter<string>();
  @Output() minimumRatingChange = new EventEmitter<number>();

  protected onTypeChanged(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedTypeChange.emit(value);
  }

  protected onCityChanged(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedCityChange.emit(value);
  }

  protected onSearchChanged(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTermChange.emit(value);
  }

  protected onMinimumRatingChanged(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.minimumRatingChange.emit(Number.isNaN(value) ? 0 : value);
  }
}
