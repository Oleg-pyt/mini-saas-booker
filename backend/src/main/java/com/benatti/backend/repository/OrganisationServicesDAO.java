package com.benatti.backend.repository;

import com.benatti.backend.entity.OrganisationServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrganisationServicesDAO extends JpaRepository<OrganisationServiceEntity, Long> {
    Optional<OrganisationServiceEntity> findByIdAndOrganisationSlugAndIsActiveTrue(Long id, String slug);
}