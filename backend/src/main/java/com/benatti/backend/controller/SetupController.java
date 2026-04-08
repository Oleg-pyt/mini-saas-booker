package com.benatti.backend.controller;

import com.benatti.api.SetupApi;
import com.benatti.api.model.OrganisationSetupRequest;
import com.benatti.api.model.OrganisationSetupResponse;
import com.benatti.api.model.OrganisationSetupUpdateRequest;
import com.benatti.api.model.SetupOrganisationDraft;
import com.benatti.api.model.SetupServiceDraft;
import com.benatti.api.model.SetupStaffCandidate;
import com.benatti.api.model.SetupOwnedBusiness;
import com.benatti.api.model.SetupUpdateServicesRequest;
import com.benatti.api.model.SetupUpdateStaffRequest;
import com.benatti.backend.service.SetupApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class SetupController implements SetupApi {
    private final SetupApplicationService setupApplicationService;

    public SetupController(SetupApplicationService setupApplicationService) {
        this.setupApplicationService = setupApplicationService;
    }

    @Override
    public ResponseEntity<OrganisationSetupResponse> createOrganisation(@Valid @RequestBody OrganisationSetupRequest organisationSetupRequest) {
        OrganisationSetupResponse response = setupApplicationService.createOrganisation(organisationSetupRequest, currentLogin());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Override
    public ResponseEntity<List<SetupOwnedBusiness>> getOwnedOrganisations() {
        return ResponseEntity.ok(setupApplicationService.getOwnedOrganisations(currentLogin()));
    }

    @Override
    public ResponseEntity<OrganisationSetupResponse> updateOrganisation(
        String businessId,
        @Valid @RequestBody OrganisationSetupUpdateRequest request
    ) {
        return ResponseEntity.ok(setupApplicationService.updateOrganisation(currentLogin(), businessId, request));
    }

    @Override
    public ResponseEntity<List<SetupStaffCandidate>> searchStaffCandidates(String query) {
        return ResponseEntity.ok(setupApplicationService.searchStaffCandidates(currentLogin(), query));
    }

    @Override
    public ResponseEntity<SetupOrganisationDraft> getOrganisationDraft(String businessId) {
        return ResponseEntity.ok(setupApplicationService.getOrganisationDraft(currentLogin(), businessId));
    }

    @Override
    public ResponseEntity<List<SetupStaffCandidate>> updateOrganisationStaff(
        String businessId,
        @Valid @RequestBody SetupUpdateStaffRequest setupUpdateStaffRequest
    ) {
        return ResponseEntity.ok(setupApplicationService.updateOrganisationStaff(currentLogin(), businessId, setupUpdateStaffRequest));
    }

    @Override
    public ResponseEntity<List<SetupServiceDraft>> updateOrganisationServices(
        String businessId,
        @Valid @RequestBody SetupUpdateServicesRequest setupUpdateServicesRequest
    ) {
        return ResponseEntity.ok(setupApplicationService.updateOrganisationServices(currentLogin(), businessId, setupUpdateServicesRequest));
    }

    private String currentLogin() {
        Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}