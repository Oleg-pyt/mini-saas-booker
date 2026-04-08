package com.benatti.backend.repository;

import com.benatti.backend.entity.OrganisationEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrganisationsDAO extends JpaRepository<OrganisationEntity, Long> {
    @EntityGraph(attributePaths = {"members", "services", "schedules"})
    List<OrganisationEntity> findAllByOrderByRatingDescNameAsc();

    @EntityGraph(attributePaths = {"members", "services", "schedules"})
    List<OrganisationEntity> findAllByUserEntityLoginOrderByNameAsc(String ownerLogin);

    @EntityGraph(attributePaths = {"members", "services", "schedules"})
    Optional<OrganisationEntity> findBySlug(String slug);

    @EntityGraph(attributePaths = {"members", "services", "schedules"})
    Optional<OrganisationEntity> findBySlugAndUserEntityLogin(String slug, String ownerLogin);

    boolean existsBySlug(String slug);
}