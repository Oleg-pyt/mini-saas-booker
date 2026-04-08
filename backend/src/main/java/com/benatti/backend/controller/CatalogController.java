package com.benatti.backend.controller;

import com.benatti.api.CatalogApi;
import com.benatti.api.model.BusinessDetails;
import com.benatti.api.model.BusinessSummary;
import com.benatti.api.model.TimeSlot;
import com.benatti.backend.service.CatalogApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class CatalogController implements CatalogApi {
    private final CatalogApplicationService catalogApplicationService;

    public CatalogController(CatalogApplicationService catalogApplicationService) {
        this.catalogApplicationService = catalogApplicationService;
    }

    @Override
    public ResponseEntity<List<BusinessSummary>> getBusinesses() {
        return ResponseEntity.ok(catalogApplicationService.getBusinesses());
    }

    @Override
    public ResponseEntity<BusinessDetails> getBusinessById(String businessId) {
        return ResponseEntity.ok(catalogApplicationService.getBusinessById(businessId));
    }

    @Override
    public ResponseEntity<List<TimeSlot>> getAvailableSlots(String businessId, String serviceId) {
        return ResponseEntity.ok(catalogApplicationService.getAvailableSlots(businessId, serviceId));
    }
}