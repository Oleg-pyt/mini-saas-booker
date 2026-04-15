import { Component, OnInit } from '@angular/core';
import { FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  OrganisationSetupServiceRequest,
  OrganisationSetupUpdateRequest,
  SetupUpdateServicesRequest,
  SetupUpdateStaffRequest
} from '@benatti/api';
import { switchMap } from 'rxjs';

import { ToastService } from '../../../common/toast/toast.service';
import { SetupOwnerBusinessesService } from '../services/setup-owner-businesses.service';
import { ServiceForm, ServiceFormValue, SetupOrganisationEditStore, SetupTab } from './store/setup-organisation-edit.store';

@Component({
  selector: 'app-setup-organisation-edit-page',
  templateUrl: './setup-organisation-edit-page.component.html',
  styleUrls: ['./setup-organisation-edit-page.component.scss'],
  standalone: false,
  providers: [SetupOrganisationEditStore]
})
export class SetupOrganisationEditPageComponent implements OnInit {
  protected readonly store: SetupOrganisationEditStore;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly setupOwnerBusinessesService: SetupOwnerBusinessesService,
    private readonly toastService: ToastService,
    store: SetupOrganisationEditStore
  ) {
    this.store = store;
  }

  protected get isLoading(): boolean {
    return this.store.snapshot.isLoading;
  }

  protected get isSubmitting(): boolean {
    return this.store.snapshot.isSubmitting;
  }

  protected get activeTab(): SetupTab {
    return this.store.snapshot.activeTab;
  }

  protected get businessSlug(): string {
    return this.store.snapshot.businessSlug;
  }

  protected get form() {
    return this.store.form;
  }

  protected get services(): FormArray<ServiceForm> {
    return this.store.services;
  }

  protected get selectedMembers() {
    return this.store.snapshot.selectedMembers;
  }

  ngOnInit(): void {
    const businessSlug = this.route.snapshot.paramMap.get('businessSlug');
    if (!businessSlug) {
      this.toastService.error('Business was not found for editing.');
      this.router.navigate(['/setup']);
      return;
    }

    this.store.setBusinessSlug(businessSlug);
    this.loadBusinessForEdit();
  }

  protected setTab(tab: SetupTab): void {
    this.store.setActiveTab(tab);
  }

  protected nextTab(): void {
    if (this.activeTab === 'summary' && this.validateSummaryTab()) {
      this.store.setActiveTab('services');
      return;
    }

    if (this.activeTab === 'services' && this.validateServicesTab()) {
      this.store.setActiveTab('team');
    }
  }

  protected previousTab(): void {
    if (this.activeTab === 'team') {
      this.store.setActiveTab('services');
      return;
    }

    if (this.activeTab === 'services') {
      this.store.setActiveTab('summary');
    }
  }

  protected submit(): void {
    const isSummaryValid = this.validateSummaryTab();
    const isServicesValid = this.validateServicesTab();
    const isTeamValid = this.validateTeamTab();

    if (!isSummaryValid || !isServicesValid || !isTeamValid || !this.businessSlug) {
      if (!isSummaryValid) {
        this.store.setActiveTab('summary');
      } else if (!isServicesValid) {
        this.store.setActiveTab('services');
      } else {
        this.store.setActiveTab('team');
      }
      return;
    }

    this.store.setSubmitting(true);
    const value = this.form.getRawValue();

    const payload: OrganisationSetupUpdateRequest = {
      image: value.image.trim(),
      type: value.type.trim(),
      city: value.city.trim(),
      address: value.address.trim(),
      description: value.description.trim() || undefined
    };

    const staffPayload: SetupUpdateStaffRequest = {
      members: this.selectedMembers.map((member) => member.login)
    };

    const servicesPayload: SetupUpdateServicesRequest = {
      services: value.services.map((service: ServiceFormValue): OrganisationSetupServiceRequest => ({
        name: service.name.trim(),
        durationMinutes: Number(service.durationMinutes),
        price: Number(service.price),
        description: service.description.trim() || undefined,
        isActive: service.isActive,
        responsibleLogin: service.isActive ? service.responsibleLogin.trim() : undefined
      }))
    };

    this.setupOwnerBusinessesService.updateOrganisation(this.businessSlug, payload).pipe(
      switchMap(() => this.setupOwnerBusinessesService.updateOrganisationStaff(this.businessSlug, staffPayload)),
      switchMap(() => this.setupOwnerBusinessesService.updateOrganisationServices(this.businessSlug, servicesPayload))
    ).subscribe({
      next: () => {
        this.toastService.success('Business profile, team and services updated successfully.');
        this.store.setSubmitting(false);
        this.router.navigate(['/business', this.businessSlug]);
      },
      error: (error) => {
        this.store.setSubmitting(false);
        if (error?.status === 404) {
          this.toastService.error('Business was not found or does not belong to you.');
          return;
        }
        this.toastService.error('Could not update business profile. Please try again.');
      }
    });
  }

  private validateSummaryTab(): boolean {
    const controls = this.form.controls;
    controls.image.markAsTouched();
    controls.type.markAsTouched();
    controls.city.markAsTouched();
    controls.address.markAsTouched();
    controls.description.markAsTouched();

    return controls.image.valid && controls.type.valid && controls.city.valid && controls.address.valid && controls.description.valid;
  }

  private validateServicesTab(): boolean {
    let isValid = this.services.length > 0;

    this.services.controls.forEach((serviceForm) => {
      serviceForm.markAllAsTouched();
      if (serviceForm.invalid) {
        isValid = false;
      }

      if (serviceForm.controls.isActive.value && !serviceForm.controls.responsibleLogin.value.trim()) {
        serviceForm.controls.responsibleLogin.markAsTouched();
        serviceForm.controls.responsibleLogin.setErrors({ required: true });
        isValid = false;
        return;
      }

      serviceForm.controls.responsibleLogin.setErrors(null);
    });

    return isValid;
  }

  private validateTeamTab(): boolean {
    if (this.selectedMembers.length >= 1) {
      return true;
    }

    this.toastService.error('Please add at least one staff member.');
    return false;
  }

  private loadBusinessForEdit(): void {
    this.store.setLoading(true);
    this.setupOwnerBusinessesService.getOrganisationDraft(this.businessSlug).subscribe({
      next: (draft) => {
        this.store.applyDraft(draft);
        this.store.searchStaff('');
        this.store.setLoading(false);
      },
      error: () => {
        this.toastService.error('Could not load business data for editing.');
        this.store.setLoading(false);
        this.router.navigate(['/setup']);
      }
    });
  }
}
