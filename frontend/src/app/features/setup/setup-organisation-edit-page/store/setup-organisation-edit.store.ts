import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { SetupOrganisationDraft, SetupStaffCandidate } from '@benatti/api';
import { BehaviorSubject, Observable } from 'rxjs';

import { ToastService } from '../../../../common/toast/toast.service';
import { SetupOwnerBusinessesService } from '../../services/setup-owner-businesses.service';

export type SetupTab = 'summary' | 'services' | 'team';

export type ServiceForm = FormGroup<{
  name: FormControl<string>;
  durationMinutes: FormControl<number>;
  price: FormControl<number>;
  description: FormControl<string>;
  isActive: FormControl<boolean>;
  responsibleLogin: FormControl<string>;
}>;

export type ServiceFormValue = ReturnType<ServiceForm['getRawValue']>;

export type EditOrganisationForm = FormGroup<{
  name: FormControl<string>;
  slug: FormControl<string>;
  image: FormControl<string>;
  type: FormControl<string>;
  city: FormControl<string>;
  address: FormControl<string>;
  description: FormControl<string>;
  services: FormArray<ServiceForm>;
}>;

export interface SetupOrganisationEditState {
  isLoading: boolean;
  isSubmitting: boolean;
  businessSlug: string;
  activeTab: SetupTab;
  staffQuery: string;
  isSearchingStaff: boolean;
  staffSearchResults: SetupStaffCandidate[];
  selectedMembers: SetupStaffCandidate[];
  ownerCandidate: SetupStaffCandidate | null;
  form: EditOrganisationForm;
}

@Injectable()
export class SetupOrganisationEditStore {
  private readonly stateSubject: BehaviorSubject<SetupOrganisationEditState>;

  readonly state$: Observable<SetupOrganisationEditState>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly setupOwnerBusinessesService: SetupOwnerBusinessesService,
    private readonly toastService: ToastService
  ) {
    this.stateSubject = new BehaviorSubject<SetupOrganisationEditState>(this.createInitialState());
    this.state$ = this.stateSubject.asObservable();
  }

  get snapshot(): SetupOrganisationEditState {
    return this.stateSubject.value;
  }

  get form(): EditOrganisationForm {
    return this.snapshot.form;
  }

  get services(): FormArray<ServiceForm> {
    return this.snapshot.form.controls.services;
  }

  get responsibleCandidates(): SetupStaffCandidate[] {
    const map = new Map<string, SetupStaffCandidate>();
    if (this.snapshot.ownerCandidate) {
      map.set(this.snapshot.ownerCandidate.login, this.snapshot.ownerCandidate);
    }

    this.snapshot.selectedMembers.forEach((member) => map.set(member.login, member));
    return [...map.values()];
  }

  setLoading(isLoading: boolean): void {
    this.patch({ isLoading });
  }

  setSubmitting(isSubmitting: boolean): void {
    this.patch({ isSubmitting });
  }

  setBusinessSlug(businessSlug: string): void {
    this.patch({ businessSlug });
  }

  setActiveTab(activeTab: SetupTab): void {
    this.patch({ activeTab });
  }

  setSelectedMembers(selectedMembers: SetupStaffCandidate[]): void {
    this.patch({ selectedMembers });
  }

  addMember(candidate: SetupStaffCandidate): void {
    if (candidate.isOwner) {
      return;
    }

    if (this.snapshot.selectedMembers.some((member) => member.login === candidate.login)) {
      return;
    }

    this.patch({ selectedMembers: [...this.snapshot.selectedMembers, candidate] });
  }

  removeMember(login: string): void {
    this.patch({
      selectedMembers: this.snapshot.selectedMembers.filter((member) => member.login !== login)
    });

    this.services.controls.forEach((serviceForm) => {
      if (serviceForm.controls.responsibleLogin.value === login) {
        serviceForm.controls.responsibleLogin.setValue('');
      }
    });

    this.emit();
  }

  addService(): void {
    this.services.push(this.createServiceForm());
    this.emit();
  }

  removeService(index: number): void {
    if (this.services.length === 1) {
      return;
    }

    this.services.removeAt(index);
    this.emit();
  }

  searchStaff(query: string): void {
    this.patch({ staffQuery: query, isSearchingStaff: true });

    this.setupOwnerBusinessesService.searchStaffCandidates(query.trim()).subscribe({
      next: (candidates) => {
        const owner = candidates.find((candidate) => candidate.isOwner);
        this.patch({
          staffSearchResults: candidates,
          ownerCandidate: owner ?? this.snapshot.ownerCandidate,
          isSearchingStaff: false
        });
      },
      error: () => {
        this.patch({ isSearchingStaff: false });
        this.toastService.error('Could not search staff by login.');
      }
    });
  }

  applyDraft(draft: SetupOrganisationDraft): void {
    while (this.services.length) {
      this.services.removeAt(0);
    }

    draft.services.forEach((service) => {
      this.services.push(this.createServiceForm(service));
    });

    if (!this.services.length) {
      this.services.push(this.createServiceForm());
    }

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

    this.patch({
      ownerCandidate: draft.owner,
      selectedMembers: draft.members
    });
  }

  private createInitialState(): SetupOrganisationEditState {
    return {
      isLoading: true,
      isSubmitting: false,
      businessSlug: '',
      activeTab: 'summary',
      staffQuery: '',
      isSearchingStaff: false,
      staffSearchResults: [],
      selectedMembers: [],
      ownerCandidate: null,
      form: this.fb.group({
        name: this.fb.nonNullable.control({ value: '', disabled: true }, [Validators.required, Validators.minLength(2), Validators.maxLength(160)]),
        slug: this.fb.nonNullable.control({ value: '', disabled: true }, [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), Validators.minLength(3), Validators.maxLength(80)]),
        image: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(1000)]),
        type: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]),
        city: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]),
        address: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3), Validators.maxLength(180)]),
        description: this.fb.nonNullable.control('', [Validators.maxLength(2000)]),
        services: this.fb.array<ServiceForm>([])
      })
    };
  }

  private createServiceForm(service?: {
    name: string;
    durationMinutes: number;
    price: number;
    description?: string;
    isActive: boolean;
    responsibleLogin?: string;
  }): ServiceForm {
    return this.fb.group({
      name: this.fb.nonNullable.control(service?.name ?? '', [Validators.required, Validators.maxLength(120)]),
      durationMinutes: this.fb.nonNullable.control(service?.durationMinutes ?? 60, [Validators.required, Validators.min(5)]),
      price: this.fb.nonNullable.control(service?.price ?? 0, [Validators.required, Validators.min(0)]),
      description: this.fb.nonNullable.control(service?.description || '', [Validators.maxLength(1000)]),
      isActive: this.fb.nonNullable.control(service?.isActive ?? true),
      responsibleLogin: this.fb.nonNullable.control(service?.responsibleLogin || '')
    });
  }

  private patch(patch: Partial<SetupOrganisationEditState>): void {
    this.stateSubject.next({
      ...this.snapshot,
      ...patch
    });
  }

  private emit(): void {
    this.stateSubject.next({ ...this.snapshot });
  }
}
