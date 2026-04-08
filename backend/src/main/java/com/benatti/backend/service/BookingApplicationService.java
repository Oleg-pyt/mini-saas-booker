package com.benatti.backend.service;

import com.benatti.api.model.BookingConfirmationResponse;
import com.benatti.api.model.BookingCreateRequest;
import com.benatti.backend.entity.BookingEntity;
import com.benatti.backend.entity.OrganisationEntity;
import com.benatti.backend.entity.OrganisationServiceEntity;
import com.benatti.backend.entity.UserEntity;
import com.benatti.backend.repository.BookingsDAO;
import com.benatti.backend.repository.UsersDAO;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class BookingApplicationService {
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Europe/Kyiv");
    private static final DateTimeFormatter SLOT_LABEL_FORMATTER =
        DateTimeFormatter.ofPattern("EEE, MMM dd, HH:mm", Locale.ENGLISH);

    private final CatalogApplicationService catalogApplicationService;
    private final SlotCalculationService slotCalculationService;
    private final UsersDAO usersDAO;
    private final BookingsDAO bookingsDAO;

    public BookingApplicationService(
        CatalogApplicationService catalogApplicationService,
        SlotCalculationService slotCalculationService,
        UsersDAO usersDAO,
        BookingsDAO bookingsDAO
    ) {
        this.catalogApplicationService = catalogApplicationService;
        this.slotCalculationService = slotCalculationService;
        this.usersDAO = usersDAO;
        this.bookingsDAO = bookingsDAO;
    }

    public BookingConfirmationResponse createBooking(BookingCreateRequest request, String login) {
        OrganisationEntity organisation = catalogApplicationService.findOrganisation(request.getBusinessId());
        OrganisationServiceEntity service = catalogApplicationService.findService(organisation, request.getServiceId());
        if (!slotCalculationService.isSlotAvailable(organisation, service, request.getStartAt())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Selected slot is no longer available");
        }

        UserEntity user = usersDAO.findByLogin(login)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        BookingEntity booking = new BookingEntity();
        booking.setOrganisation(organisation);
        booking.setService(service);
        booking.setUser(user);
        booking.setStartAt(request.getStartAt());
        booking.setEndAt(request.getStartAt().plusMinutes(service.getDurationMinutes()));
        booking.setStatus("CONFIRMED");
        booking.setNotes(request.getNotes());

        BookingEntity savedBooking = bookingsDAO.save(booking);

        return new BookingConfirmationResponse(
            "BK-" + savedBooking.getId(),
            organisation.getSlug(),
            organisation.getName(),
            service.getName(),
            savedBooking.getStartAt().atZoneSameInstant(BUSINESS_ZONE).format(SLOT_LABEL_FORMATTER),
            user.getName()
        );
    }
}