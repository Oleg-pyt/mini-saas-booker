package com.benatti.backend.service;

import com.benatti.api.model.OrganisationSetupRequest;
import com.benatti.api.model.OrganisationSetupResponse;
import com.benatti.api.model.OrganisationSetupServiceRequest;
import com.benatti.api.model.OrganisationSetupUpdateRequest;
import com.benatti.api.model.SetupOrganisationDraft;
import com.benatti.api.model.SetupServiceDraft;
import com.benatti.api.model.SetupStaffCandidate;
import com.benatti.api.model.SetupOwnedBusiness;
import com.benatti.api.model.SetupUpdateServicesRequest;
import com.benatti.api.model.SetupUpdateStaffRequest;
import com.benatti.backend.entity.OrganisationEntity;
import com.benatti.backend.entity.OrganisationMember;
import com.benatti.backend.entity.OrganisationScheduleEntity;
import com.benatti.backend.entity.OrganisationServiceEntity;
import com.benatti.backend.entity.UserEntity;
import com.benatti.backend.entity.UserRole;
import com.benatti.backend.repository.OrganisationsDAO;
import com.benatti.backend.repository.UsersDAO;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class SetupApplicationService {
    private final OrganisationsDAO organisationsDAO;
    private final UsersDAO usersDAO;

    public SetupApplicationService(OrganisationsDAO organisationsDAO, UsersDAO usersDAO) {
        this.organisationsDAO = organisationsDAO;
        this.usersDAO = usersDAO;
    }

    public OrganisationSetupResponse createOrganisation(OrganisationSetupRequest request, String ownerLogin) {
        UserEntity owner = usersDAO.findByLogin(ownerLogin)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (owner.getRole() != UserRole.BUSINESS_OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only BUSINESS_OWNER can create organisations");
        }

        if (organisationsDAO.existsBySlug(request.getSlug())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Organisation slug already exists");
        }

        OrganisationEntity organisation = new OrganisationEntity();
        organisation.setName(request.getName().trim());
        organisation.setSlug(request.getSlug().trim());
        organisation.setCoverImageUrl(request.getImage().trim());
        organisation.setType(request.getType().trim());
        organisation.setCity(request.getCity().trim());
        organisation.setAddress(request.getAddress().trim());
        organisation.setDescription(request.getDescription() == null ? "" : request.getDescription().trim());
        organisation.setUserEntity(owner);
        organisation.setRating(0.0d);
        organisation.setReviewsCount(0);

        if (request.getMembers() == null || request.getMembers().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one staff member is required");
        }

        List<UserEntity> members = resolveMembersFromLogins(request.getMembers(), owner);
        Set<String> allowedResponsibleLogins = new HashSet<>();
        allowedResponsibleLogins.add(owner.getLogin());
        members.forEach(member -> allowedResponsibleLogins.add(member.getLogin()));

        for (OrganisationSetupServiceRequest setupService : request.getServices()) {
            String responsibleLogin = setupService.getResponsibleLogin() == null ? null : setupService.getResponsibleLogin().trim();
            UserEntity responsibleUser = null;

            if (Boolean.TRUE.equals(setupService.getIsActive())) {
                if (responsibleLogin == null || responsibleLogin.isBlank()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Active service must have a responsible person");
                }

                if (!allowedResponsibleLogins.contains(responsibleLogin)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Responsible person must be owner or organisation staff");
                }

                responsibleUser = usersDAO.findByLogin(responsibleLogin)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Responsible person login not found"));
            }

            OrganisationServiceEntity service = new OrganisationServiceEntity();
            service.setOrganisation(organisation);
            service.setName(setupService.getName().trim());
            service.setDurationMinutes(setupService.getDurationMinutes());
            service.setPrice(setupService.getPrice());
            service.setDescription(setupService.getDescription() == null ? "" : setupService.getDescription().trim());
            service.setIsActive(setupService.getIsActive());
            service.setResponsibleUser(Boolean.TRUE.equals(setupService.getIsActive()) ? responsibleUser : null);
            organisation.getServices().add(service);
        }

        for (OrganisationScheduleEntity schedule : createDefaultSchedule(9, 18, 30)) {
            schedule.setOrganisation(organisation);
            organisation.getSchedules().add(schedule);
        }

        for (UserEntity member : members) {
            OrganisationMember organisationMember = new OrganisationMember();
            organisationMember.setOrganisation(organisation);
            organisationMember.setUser(member);
            organisation.getMembers().add(organisationMember);
        }

        OrganisationEntity saved = organisationsDAO.save(organisation);
        return new OrganisationSetupResponse(saved.getId(), saved.getSlug(), saved.getName());
    }

    public List<SetupOwnedBusiness> getOwnedOrganisations(String ownerLogin) {
        ensureOwnerRole(ownerLogin);

        return organisationsDAO.findAllByUserEntityLoginOrderByNameAsc(ownerLogin).stream()
            .map(this::toOwnedBusinessResponse)
            .toList();
    }

    public OrganisationSetupResponse updateOrganisation(String ownerLogin, String businessId, OrganisationSetupUpdateRequest request) {
        ensureOwnerRole(ownerLogin);

        OrganisationEntity organisation = organisationsDAO.findBySlugAndUserEntityLogin(businessId, ownerLogin)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Business not found"));

        // After creation, name and slug remain immutable and are intentionally not updated.
        organisation.setCoverImageUrl(request.getImage().trim());
        organisation.setType(request.getType().trim());
        organisation.setCity(request.getCity().trim());
        organisation.setAddress(request.getAddress().trim());
        organisation.setDescription(request.getDescription() == null ? "" : request.getDescription().trim());

        OrganisationEntity saved = organisationsDAO.save(organisation);
        return new OrganisationSetupResponse(saved.getId(), saved.getSlug(), saved.getName());
    }

    public List<SetupStaffCandidate> searchStaffCandidates(String ownerLogin, String query) {
        UserEntity owner = ensureOwnerRole(ownerLogin);

        String normalizedQuery = query == null ? "" : query.trim();
        List<SetupStaffCandidate> candidates = new ArrayList<>();

        boolean ownerMatches = normalizedQuery.isEmpty() || owner.getLogin().toLowerCase().contains(normalizedQuery.toLowerCase());
        if (ownerMatches) {
            candidates.add(toStaffCandidate(owner.getLogin(), owner.getName(), true));
        }

        if (normalizedQuery.isEmpty()) {
            return candidates;
        }

        usersDAO.findTop20ByLoginContainingIgnoreCaseOrderByLoginAsc(normalizedQuery).stream()
            .filter(user -> !user.getId().equals(owner.getId()))
            .forEach(user -> candidates.add(toStaffCandidate(user.getLogin(), user.getName(), false)));

        return candidates;
    }

    public SetupOrganisationDraft getOrganisationDraft(String ownerLogin, String businessId) {
        UserEntity owner = ensureOwnerRole(ownerLogin);
        OrganisationEntity organisation = organisationsDAO.findBySlugAndUserEntityLogin(businessId, ownerLogin)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Business not found"));

        List<SetupStaffCandidate> members = organisation.getMembers().stream()
            .map(member -> toStaffCandidate(member.getUser().getLogin(), member.getUser().getName(), false))
            .sorted(Comparator.comparing(SetupStaffCandidate::getLogin))
            .toList();

        List<SetupServiceDraft> services = organisation.getServices().stream()
            .sorted(Comparator.comparing(OrganisationServiceEntity::getId, Comparator.nullsLast(Comparator.naturalOrder())))
            .map(this::toServiceDraft)
            .toList();

        SetupOrganisationDraft draft = new SetupOrganisationDraft();
        draft.setName(organisation.getName());
        draft.setSlug(organisation.getSlug());
        draft.setImage(organisation.getCoverImageUrl());
        draft.setType(organisation.getType());
        draft.setCity(organisation.getCity());
        draft.setAddress(organisation.getAddress());
        draft.setDescription(organisation.getDescription());
        draft.setOwner(toStaffCandidate(owner.getLogin(), owner.getName(), true));
        draft.setMembers(members);
        draft.setServices(services);
        return draft;
    }

    public List<SetupStaffCandidate> updateOrganisationStaff(String ownerLogin, String businessId, SetupUpdateStaffRequest request) {
        UserEntity owner = ensureOwnerRole(ownerLogin);
        OrganisationEntity organisation = organisationsDAO.findBySlugAndUserEntityLogin(businessId, ownerLogin)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Business not found"));

        List<UserEntity> members = resolveMembersFromLogins(request.getMembers(), owner);

        organisation.getMembers().clear();
        for (UserEntity member : members) {
            OrganisationMember organisationMember = new OrganisationMember();
            organisationMember.setOrganisation(organisation);
            organisationMember.setUser(member);
            organisation.getMembers().add(organisationMember);
        }

        OrganisationEntity saved = organisationsDAO.save(organisation);
        return saved.getMembers().stream()
            .map(member -> toStaffCandidate(member.getUser().getLogin(), member.getUser().getName(), false))
            .sorted(Comparator.comparing(SetupStaffCandidate::getLogin))
            .toList();
    }

    public List<SetupServiceDraft> updateOrganisationServices(String ownerLogin, String businessId, SetupUpdateServicesRequest request) {
        ensureOwnerRole(ownerLogin);
        OrganisationEntity organisation = organisationsDAO.findBySlugAndUserEntityLogin(businessId, ownerLogin)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Business not found"));

        Set<String> allowedResponsibleLogins = new HashSet<>();
        allowedResponsibleLogins.add(organisation.getUserEntity().getLogin());
        organisation.getMembers().forEach(member -> allowedResponsibleLogins.add(member.getUser().getLogin()));

        organisation.getServices().clear();
        for (OrganisationSetupServiceRequest requestService : request.getServices()) {
            String normalizedResponsibleLogin = requestService.getResponsibleLogin() == null
                ? null
                : requestService.getResponsibleLogin().trim();

            if (Boolean.TRUE.equals(requestService.getIsActive()) && (normalizedResponsibleLogin == null || normalizedResponsibleLogin.isBlank())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Active service must have a responsible person");
            }

            if (normalizedResponsibleLogin != null && !normalizedResponsibleLogin.isBlank() && !allowedResponsibleLogins.contains(normalizedResponsibleLogin)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Responsible person must be owner or organisation staff");
            }

            UserEntity responsibleUser = null;
            if (normalizedResponsibleLogin != null && !normalizedResponsibleLogin.isBlank()) {
                responsibleUser = usersDAO.findByLogin(normalizedResponsibleLogin)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Responsible person login not found"));
            }

            OrganisationServiceEntity service = new OrganisationServiceEntity();
            service.setOrganisation(organisation);
            service.setName(requestService.getName().trim());
            service.setDurationMinutes(requestService.getDurationMinutes());
            service.setPrice(requestService.getPrice());
            service.setDescription(requestService.getDescription() == null ? "" : requestService.getDescription().trim());
            service.setIsActive(requestService.getIsActive());
            service.setResponsibleUser(Boolean.TRUE.equals(requestService.getIsActive()) ? responsibleUser : null);
            organisation.getServices().add(service);
        }

        OrganisationEntity saved = organisationsDAO.save(organisation);
        return saved.getServices().stream()
            .sorted(Comparator.comparing(OrganisationServiceEntity::getId, Comparator.nullsLast(Comparator.naturalOrder())))
            .map(this::toServiceDraft)
            .toList();
    }

    private UserEntity ensureOwnerRole(String ownerLogin) {
        UserEntity owner = usersDAO.findByLogin(ownerLogin)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (owner.getRole() != UserRole.BUSINESS_OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only BUSINESS_OWNER can manage organisations");
        }

        return owner;
    }

    private SetupOwnedBusiness toOwnedBusinessResponse(OrganisationEntity organisation) {
        SetupOwnedBusiness response = new SetupOwnedBusiness();
        response.setId(organisation.getSlug());
        response.setSlug(organisation.getSlug());
        response.setName(organisation.getName());
        response.setType(organisation.getType());
        response.setCity(organisation.getCity());
        response.setImage(organisation.getCoverImageUrl());
        return response;
    }

    private SetupStaffCandidate toStaffCandidate(String login, String name, boolean isOwner) {
        SetupStaffCandidate candidate = new SetupStaffCandidate();
        candidate.setLogin(login);
        candidate.setName(name);
        candidate.setIsOwner(isOwner);
        return candidate;
    }

    private SetupServiceDraft toServiceDraft(OrganisationServiceEntity service) {
        SetupServiceDraft draft = new SetupServiceDraft();
        draft.setName(service.getName());
        draft.setDurationMinutes(service.getDurationMinutes());
        draft.setPrice(service.getPrice());
        draft.setDescription(service.getDescription());
        draft.setIsActive(service.getIsActive());
        draft.setResponsibleLogin(service.getResponsibleUser() == null ? null : service.getResponsibleUser().getLogin());
        return draft;
    }

    private List<UserEntity> resolveMembersFromLogins(List<String> memberLogins, UserEntity owner) {
        Set<String> uniqueLogins = new LinkedHashSet<>();
        for (String rawLogin : memberLogins) {
            if (rawLogin == null) {
                continue;
            }

            String login = rawLogin.trim();
            if (login.isBlank()) {
                continue;
            }

            if (login.equals(owner.getLogin())) {
                continue;
            }

            uniqueLogins.add(login);
        }

        if (uniqueLogins.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one staff member is required");
        }

        List<UserEntity> members = new ArrayList<>();
        for (String login : uniqueLogins) {
            UserEntity user = usersDAO.findByLogin(login)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Staff member not found: " + login));
            members.add(user);
        }

        return members;
    }

    private List<OrganisationScheduleEntity> createDefaultSchedule(int openingHour, int closingHour, int slotStepMinutes) {
        List<OrganisationScheduleEntity> schedules = new ArrayList<>();
        schedules.add(createSchedule(DayOfWeek.MONDAY, true, openingHour, closingHour, slotStepMinutes));
        schedules.add(createSchedule(DayOfWeek.TUESDAY, true, openingHour, closingHour, slotStepMinutes));
        schedules.add(createSchedule(DayOfWeek.WEDNESDAY, true, openingHour, closingHour, slotStepMinutes));
        schedules.add(createSchedule(DayOfWeek.THURSDAY, true, openingHour, closingHour, slotStepMinutes));
        schedules.add(createSchedule(DayOfWeek.FRIDAY, true, openingHour, closingHour, slotStepMinutes));
        schedules.add(createSchedule(DayOfWeek.SATURDAY, true, openingHour, closingHour - 2, slotStepMinutes));
        schedules.add(createSchedule(DayOfWeek.SUNDAY, false, null, null, slotStepMinutes));
        return schedules;
    }

    private OrganisationScheduleEntity createSchedule(
        DayOfWeek dayOfWeek,
        boolean isWorkingDay,
        Integer openingHour,
        Integer closingHour,
        int slotStepMinutes
    ) {
        OrganisationScheduleEntity schedule = new OrganisationScheduleEntity();
        schedule.setDayOfWeek(dayOfWeek);
        schedule.setIsWorkingDay(isWorkingDay);
        schedule.setStartTime(openingHour == null ? null : LocalTime.of(openingHour, 0));
        schedule.setEndTime(closingHour == null ? null : LocalTime.of(closingHour, 0));
        schedule.setSlotStepMinutes(slotStepMinutes);
        return schedule;
    }
}