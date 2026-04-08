import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  OrganisationSetupServiceRequest,
  OrganisationSetupUpdateRequest,
  SetupStaffCandidate,
  SetupUpdateServicesRequest,
  SetupUpdateStaffRequest
} from '@benatti/api';
import { switchMap } from 'rxjs';

import { ToastService } from '../../../common/toast/toast.service';
import { SetupOwnerBusinessesService } from '../services/setup-owner-businesses.service';

type SetupTab = 'summary' | 'services' | 'team';

type ServiceForm = FormGroup<{
  name: FormControl<string>;
  durationMinutes: FormControl<number>;
  price: FormControl<number>;
  description: FormControl<string>;
  isActive: FormControl<boolean>;
  responsibleLogin: FormControl<string>;
}>;

type ServiceFormValue = ReturnType<ServiceForm['getRawValue']>;

type EditOrganisationForm = FormGroup<{
  name: FormControl<string>;
  slug: FormControl<string>;
  image: FormControl<string>;
  type: FormControl<string>;
  city: FormControl<string>;
  address: FormControl<string>;
  description: FormControl<string>;
  services: FormArray<ServiceForm>;
}>;

@Component({
  selector: 'app-setup-organisation-edit-page',
  templateUrl: './setup-organisation-edit-page.component.html',
  styleUrls: ['./setup-organisation-edit-page.component.scss'],
  standalone: false
})
export class SetupOrganisationEditPageComponent implements OnInit {
  protected isLoading = true;
  protected isSubmitting = false;
  protected businessSlug = '';
  protected activeTab: SetupTab = 'summary';
  protected staffQuery = '';
  protected isSearchingStaff = false;
  protected staffSearchResults: SetupStaffCandidate[] = [];
  protected selectedMembers: SetupStaffCandidate[] = [];
  protected ownerCandidate: SetupStaffCandidate | null = null;

  protected form: EditOrganisationForm;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly setupOwnerBusinessesService: SetupOwnerBusinessesService,
    private readonly toastService: ToastService
  ) {
    this.form = this.fb.group({
      name: this.fb.nonNullable.control({ value: '', disabled: true }, [Validators.required, Validators.minLength(2), Validators.maxLength(160)]),
      slug: this.fb.nonNullable.control({ value: '', disabled: true }, [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), Validators.minLength(3), Validators.maxLength(80)]),
      image: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(1000)]),
      type: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]),
      city: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]),
      address: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3), Validators.maxLength(180)]),
      description: this.fb.nonNullable.control('', [Validators.maxLength(2000)]),
      services: this.fb.array<ServiceForm>([])
    });
  }

  protected get services(): FormArray<ServiceForm> {
    return this.form.controls.services;
  }

  ngOnInit(): void {
    const businessSlug = this.route.snapshot.paramMap.get('businessSlug');
    if (!businessSlug) {
      this.toastService.error('Business was not found for editing.');
      this.router.navigate(['/setup']);
      return;
    }

    this.businessSlug = businessSlug;
    this.loadBusinessForEdit();
  }

  protected setTab(tab: SetupTab): void {
    this.activeTab = tab;
  }

  protected nextTab(): void {
    if (this.activeTab === 'summary' && this.validateSummaryTab()) {
      this.activeTab = 'services';
      return;
    }

    if (this.activeTab === 'services' && this.validateServicesTab()) {
      this.activeTab = 'team';
    }
  }

  protected previousTab(): void {
    if (this.activeTab === 'team') {
      this.activeTab = 'services';
      return;
    }

    if (this.activeTab === 'services') {
      this.activeTab = 'summary';
    }
  }

  protected addService(): void {
    this.services.push(this.createServiceForm());
  }

  protected removeService(index: number): void {
    if (this.services.length === 1) {
      return;
    }

    this.services.removeAt(index);
  }

  protected searchStaff(query: string): void {
    this.staffQuery = query;
    this.isSearchingStaff = true;

    this.setupOwnerBusinessesService.searchStaffCandidates(query.trim()).subscribe({
      next: (candidates) => {
        this.staffSearchResults = candidates;
        const owner = candidates.find((candidate) => candidate.isOwner);
        if (owner) {
          this.ownerCandidate = owner;
        }
        this.isSearchingStaff = false;
      },
      error: () => {
        this.isSearchingStaff = false;
        this.toastService.error('Could not search staff by login.');
      }
    });
  }

  protected addMember(candidate: SetupStaffCandidate): void {
    if (candidate.isOwner) {
      return;
    }

    if (this.selectedMembers.some((member) => member.login === candidate.login)) {
      return;
    }

    this.selectedMembers = [...this.selectedMembers, candidate];
  }

  protected removeMember(login: string): void {
    this.selectedMembers = this.selectedMembers.filter((member) => member.login !== login);
    this.services.controls.forEach((serviceForm) => {
      if (serviceForm.controls.responsibleLogin.value === login) {
        serviceForm.controls.responsibleLogin.setValue('');
      }
    });
  }

  protected isMemberSelected(login: string): boolean {
    return this.selectedMembers.some((member) => member.login === login);
  }

  protected get responsibleCandidates(): SetupStaffCandidate[] {
    const map = new Map<string, SetupStaffCandidate>();
    if (this.ownerCandidate) {
      map.set(this.ownerCandidate.login, this.ownerCandidate);
    }

    this.selectedMembers.forEach((member) => map.set(member.login, member));
    return [...map.values()];
  }

  protected submit(): void {
    const isSummaryValid = this.validateSummaryTab();
    const isServicesValid = this.validateServicesTab();
    const isTeamValid = this.validateTeamTab();

    if (!isSummaryValid || !isServicesValid || !isTeamValid || !this.businessSlug) {
      if (!isSummaryValid) {
        this.activeTab = 'summary';
      } else if (!isServicesValid) {
        this.activeTab = 'services';
      } else {
        this.activeTab = 'team';
      }
      return;
    }

    this.isSubmitting = true;
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
        this.isSubmitting = false;
        this.router.navigate(['/business', this.businessSlug]);
      },
      error: (error) => {
        this.isSubmitting = false;
        if (error?.status === 404) {
          this.toastService.error('Business was not found or does not belong to you.');
          return;
        }
        this.toastService.error('Could not update business profile. Please try again.');
      }
    });
  }

  private createServiceForm(): ServiceForm {
    return this.fb.group({
      name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(120)]),
      durationMinutes: this.fb.nonNullable.control(60, [Validators.required, Validators.min(5)]),
      price: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0)]),
      description: this.fb.nonNullable.control('', [Validators.maxLength(1000)]),
      isActive: this.fb.nonNullable.control(true),
      responsibleLogin: this.fb.nonNullable.control('')
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
    this.isLoading = true;
    this.setupOwnerBusinessesService.getOrganisationDraft(this.businessSlug).subscribe({
      next: (draft) => {
        while (this.services.length) {
          this.services.removeAt(0);
        }

        draft.services.forEach((service) => {
          this.services.push(this.fb.group({
            name: this.fb.nonNullable.control(service.name, [Validators.required, Validators.maxLength(120)]),
            durationMinutes: this.fb.nonNullable.control(service.durationMinutes, [Validators.required, Validators.min(5)]),
            price: this.fb.nonNullable.control(service.price, [Validators.required, Validators.min(0)]),
            description: this.fb.nonNullable.control(service.description || '', [Validators.maxLength(1000)]),
            isActive: this.fb.nonNullable.control(service.isActive),
            responsibleLogin: this.fb.nonNullable.control(service.responsibleLogin || '')
          }));
        });

        if (!this.services.length) {
          this.services.push(this.createServiceForm());
        }

        this.ownerCandidate = draft.owner;
        this.selectedMembers = draft.members;

        this.form.setValue({
          name: draft.name,
          slug: draft.slug,
          image: draft.image,
          type: draft.type,
          city: draft.city,
          address: draft.address,
          description: draft.description || '',
          services: this.services.getRawValue()
        });

        this.searchStaff('');
        this.isLoading = false;
      },
      error: () => {
        this.toastService.error('Could not load business data for editing.');
        this.isLoading = false;
        this.router.navigate(['/setup']);
      }
    });
  }
}
