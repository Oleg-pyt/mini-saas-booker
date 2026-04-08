import { Inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  OrganisationSetupResponse,
  OrganisationSetupUpdateRequest,
  SetupOrganisationDraft,
  SetupOwnedBusiness as SetupOwnedBusinessApi,
  SetupServiceDraft,
  SetupStaffCandidate,
  SetupUpdateServicesRequest,
  SetupUpdateStaffRequest,
  SetupService
} from '@benatti/api';

export interface SetupOwnedBusiness {
  slug: string;
  name: string;
  type: string;
  city: string;
  coverImageUrl: string;
}

@Injectable({ providedIn: 'root' })
export class SetupOwnerBusinessesService {
  constructor(@Inject(SetupService) private readonly setupApi: SetupService) {}

  getOwnedBusinesses(): Observable<SetupOwnedBusiness[]> {
    return this.setupApi.getOwnedOrganisations().pipe(
      map((businesses) => businesses.map((business) => ({
        slug: business.slug,
        name: business.name,
        type: business.type,
        city: business.city,
        coverImageUrl: business.image
      })))
    );
  }

  updateOrganisation(businessSlug: string, payload: OrganisationSetupUpdateRequest): Observable<OrganisationSetupResponse> {
    return this.setupApi.updateOrganisation(businessSlug, payload);
  }

  getOrganisationDraft(businessSlug: string): Observable<SetupOrganisationDraft> {
    return this.setupApi.getOrganisationDraft(businessSlug);
  }

  searchStaffCandidates(query: string): Observable<SetupStaffCandidate[]> {
    return this.setupApi.searchStaffCandidates(query);
  }

  updateOrganisationStaff(businessSlug: string, payload: SetupUpdateStaffRequest): Observable<SetupStaffCandidate[]> {
    return this.setupApi.updateOrganisationStaff(businessSlug, payload);
  }

  updateOrganisationServices(businessSlug: string, payload: SetupUpdateServicesRequest): Observable<SetupServiceDraft[]> {
    return this.setupApi.updateOrganisationServices(businessSlug, payload);
  }
}
