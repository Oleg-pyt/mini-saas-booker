import { Component } from '@angular/core';

import { SetupOrganisationEditStore } from '../../store/setup-organisation-edit.store';

@Component({
  selector: 'app-setup-organisation-edit-services-tab',
  templateUrl: './setup-organisation-edit-services-tab.component.html',
  styleUrls: ['./setup-organisation-edit-services-tab.component.scss'],
  standalone: false
})
export class SetupOrganisationEditServicesTabComponent {
  private expandedIndexes = new Set<number>();

  constructor(private readonly store: SetupOrganisationEditStore) {}

  protected get services() {
    return this.store.services;
  }

  protected get responsibleCandidates() {
    return this.store.responsibleCandidates;
  }

  protected onAddService(): void {
    this.store.addService();
  }

  protected onRemoveService(index: number): void {
    this.store.removeService(index);

    const nextExpandedIndexes = new Set<number>();
    this.expandedIndexes.forEach((value) => {
      if (value < index) {
        nextExpandedIndexes.add(value);
      }

      if (value > index) {
        nextExpandedIndexes.add(value - 1);
      }
    });
    this.expandedIndexes = nextExpandedIndexes;
  }

  protected isExpanded(index: number): boolean {
    return this.expandedIndexes.has(index);
  }

  protected toggleExpanded(index: number): void {
    if (this.expandedIndexes.has(index)) {
      this.expandedIndexes.delete(index);
      return;
    }

    this.expandedIndexes.add(index);
  }

  protected getServiceSummary(index: number): string {
    const service = this.services.at(index);
    const name = service.controls.name.value.trim() || 'Untitled';
    return `${name} - ${service.controls.durationMinutes.value} min - ${service.controls.price.value} UAH`;
  }
}
