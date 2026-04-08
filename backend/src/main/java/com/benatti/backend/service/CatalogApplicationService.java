package com.benatti.backend.service;

import com.benatti.api.model.BusinessDetails;
import com.benatti.api.model.BusinessService;
import com.benatti.api.model.BusinessSummary;
import com.benatti.api.model.TimeSlot;
import com.benatti.backend.entity.OrganisationEntity;
import com.benatti.backend.entity.OrganisationServiceEntity;
import com.benatti.backend.repository.OrganisationServicesDAO;
import com.benatti.backend.repository.OrganisationsDAO;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

@Service
public class CatalogApplicationService {
    private final OrganisationsDAO organisationsDAO;
    private final OrganisationServicesDAO organisationServicesDAO;
    private final SlotCalculationService slotCalculationService;

    public CatalogApplicationService(
        OrganisationsDAO organisationsDAO,
        OrganisationServicesDAO organisationServicesDAO,
        SlotCalculationService slotCalculationService
    ) {
        this.organisationsDAO = organisationsDAO;
        this.organisationServicesDAO = organisationServicesDAO;
        this.slotCalculationService = slotCalculationService;
    }

    public List<BusinessSummary> getBusinesses() {
        return organisationsDAO.findAllByOrderByRatingDescNameAsc().stream()
            .map(this::toBusinessSummary)
            .toList();
    }

    public BusinessDetails getBusinessById(String businessId) {
        OrganisationEntity organisation = findOrganisation(businessId);
        BusinessSummary summary = toBusinessSummary(organisation);
        List<BusinessService> services = organisation.getServices().stream()
            .filter(service -> Boolean.TRUE.equals(service.getIsActive()))
            .sorted(Comparator.comparing(OrganisationServiceEntity::getPrice).thenComparing(OrganisationServiceEntity::getName))
            .map(this::toBusinessService)
            .toList();

        return new BusinessDetails(
            summary.getId(),
            summary.getType(),
            summary.getName(),
            summary.getCity(),
            summary.getRating(),
            summary.getReviewsCount(),
            summary.getCoverImageUrl(),
            summary.getPriceFrom(),
            summary.getNextAvailableSlot(),
            organisation.getDescription(),
            organisation.getAddress(),
            services
        );
    }

    public List<TimeSlot> getAvailableSlots(String businessId, String serviceId) {
        OrganisationEntity organisation = findOrganisation(businessId);
        OrganisationServiceEntity service = findService(organisation, serviceId);
        return slotCalculationService.getAvailableSlots(organisation, service, 12);
    }

    public OrganisationEntity findOrganisation(String businessId) {
        return organisationsDAO.findBySlug(businessId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Business not found"));
    }

    public OrganisationServiceEntity findService(OrganisationEntity organisation, String serviceId) {
        Long servicePrimaryKey = parseLongId(serviceId, "Invalid serviceId");
        return organisationServicesDAO.findByIdAndOrganisationSlugAndIsActiveTrue(servicePrimaryKey, organisation.getSlug())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service not found"));
    }

    private BusinessSummary toBusinessSummary(OrganisationEntity organisation) {
        int priceFrom = organisation.getServices().stream()
            .filter(service -> Boolean.TRUE.equals(service.getIsActive()))
            .map(OrganisationServiceEntity::getPrice)
            .min(Integer::compareTo)
            .orElse(0);
        TimeSlot nextAvailableSlot = slotCalculationService.findNextAvailableSlot(organisation)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "No available slots configured"));

        return new BusinessSummary(
            organisation.getSlug(),
            organisation.getType(),
            organisation.getName(),
            organisation.getCity(),
            organisation.getRating(),
            organisation.getReviewsCount(),
            organisation.getCoverImageUrl(),
            priceFrom,
            nextAvailableSlot
        );
    }

    private BusinessService toBusinessService(OrganisationServiceEntity service) {
        return new BusinessService(
            String.valueOf(service.getId()),
            service.getName(),
            service.getDescription(),
            service.getDurationMinutes(),
            service.getPrice(),
            service.getIsActive()
        );
    }

    private Long parseLongId(String value, String message) {
        try {
            return Long.valueOf(value);
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }
}