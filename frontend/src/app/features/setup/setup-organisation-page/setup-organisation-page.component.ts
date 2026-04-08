import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import {
  OrganisationSetupRequest,
  OrganisationSetupServiceRequest,
  SetupStaffCandidate,
  SetupService
} from '@benatti/api';
import { ToastService } from '../../../common/toast/toast.service';

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

type SetupOrganisationForm = FormGroup<{
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
  selector: 'app-setup-organisation-page',
  templateUrl: './setup-organisation-page.component.html',
  styleUrls: ['./setup-organisation-page.component.scss'],
  standalone: false
})
export class SetupOrganisationPageComponent implements OnInit {
  protected isSubmitting = false;
  protected activeTab: SetupTab = 'summary';
  protected staffQuery = '';
  protected isSearchingStaff = false;
  protected staffSearchResults: SetupStaffCandidate[] = [];
  protected selectedMembers: SetupStaffCandidate[] = [];
  protected ownerCandidate: SetupStaffCandidate | null = null;

  protected form!: SetupOrganisationForm;

  constructor(
    private readonly fb: FormBuilder,
    @Inject(SetupService) private readonly setupApi: SetupService,
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {
    this.form = this.fb.group({
      name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]),
      slug: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), Validators.minLength(3), Validators.maxLength(80)]),
      image: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(1000)]),
      type: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]),
      city: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]),
      address: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3), Validators.maxLength(180)]),
      description: this.fb.nonNullable.control('', [Validators.maxLength(2000)]),
      services: this.fb.array<ServiceForm>([this.createServiceForm()])
    });
  }

  ngOnInit(): void {
    this.searchStaff('');
  }

  protected get services(): FormArray<ServiceForm> {
    return this.form.controls['services'];
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

  protected searchStaff(query: string): void {
    this.staffQuery = query;
    this.isSearchingStaff = true;

    this.setupApi.searchStaffCandidates(query.trim() || undefined).subscribe({
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

  protected normalizeSlug(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const normalized = raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    this.form.controls['slug'].setValue(normalized, { emitEvent: false });
  }

  protected submit(): void {
    const isSummaryValid = this.validateSummaryTab();
    const isServicesValid = this.validateServicesTab();
    const isTeamValid = this.validateTeamTab();

    if (!isSummaryValid || !isServicesValid || !isTeamValid) {
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

    const payload = this.toRequest();

    this.setupApi.createOrganisation(payload).subscribe({
      next: (response) => {
        this.toastService.success(`Organisation ${response.name} created successfully.`);
        this.isSubmitting = false;
        this.router.navigate(['/business', response.slug]);
      },
      error: (error) => {
        this.isSubmitting = false;
        if (error?.status === 409) {
          this.toastService.error('Slug already exists. Please choose another one.');
          return;
        }
        if (error?.status === 403) {
          this.toastService.error('Only BUSINESS_OWNER can create organisations.');
          return;
        }
        this.toastService.error('Could not create organisation. Please try again.');
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
    controls.name.markAsTouched();
    controls.slug.markAsTouched();
    controls.image.markAsTouched();
    controls.type.markAsTouched();
    controls.city.markAsTouched();
    controls.address.markAsTouched();
    controls.description.markAsTouched();

    return (
      controls.name.valid &&
      controls.slug.valid &&
      controls.image.valid &&
      controls.type.valid &&
      controls.city.valid &&
      controls.address.valid &&
      controls.description.valid
    );
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

  private toRequest(): OrganisationSetupRequest {
    const formValue = this.form.getRawValue();
    const services: OrganisationSetupServiceRequest[] = formValue.services.map((service: ServiceFormValue) => ({
      name: service.name.trim(),
      durationMinutes: Number(service.durationMinutes),
      price: Number(service.price),
      description: service.description.trim() || undefined,
      isActive: service.isActive,
      responsibleLogin: service.isActive ? service.responsibleLogin.trim() : undefined
    }));

    return {
      name: formValue.name.trim(),
      slug: formValue.slug.trim(),
      image: formValue.image.trim(),
      type: formValue.type.trim(),
      city: formValue.city.trim(),
      address: formValue.address.trim(),
      description: formValue.description.trim() || undefined,
      members: this.selectedMembers.map((member) => member.login),
      services
    };
  }
}