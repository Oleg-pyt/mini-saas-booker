package com.benatti.backend.service;

import com.benatti.api.model.TimeSlot;
import com.benatti.backend.entity.BookingEntity;
import com.benatti.backend.entity.OrganisationEntity;
import com.benatti.backend.entity.OrganisationScheduleEntity;
import com.benatti.backend.entity.OrganisationServiceEntity;
import com.benatti.backend.repository.BookingsDAO;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SlotCalculationService {
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Europe/Kyiv");
    private static final int SLOT_LOOKAHEAD_DAYS = 14;
    private static final int DEFAULT_SLOT_LIMIT = 12;
    private static final DateTimeFormatter SLOT_LABEL_FORMATTER =
        DateTimeFormatter.ofPattern("EEE, MMM dd, HH:mm", Locale.ENGLISH);

    private final BookingsDAO bookingsDAO;

    public SlotCalculationService(BookingsDAO bookingsDAO) {
        this.bookingsDAO = bookingsDAO;
    }

    public Optional<TimeSlot> findNextAvailableSlot(OrganisationEntity organisation) {
        return organisation.getServices().stream()
            .filter(service -> Boolean.TRUE.equals(service.getIsActive()))
            .map(service -> getAvailableSlots(organisation, service, 1).stream().findFirst())
            .flatMap(Optional::stream)
            .min(Comparator.comparing(TimeSlot::getStartAt));
    }

    public List<TimeSlot> getAvailableSlots(OrganisationEntity organisation, OrganisationServiceEntity service, int limit) {
        OffsetDateTime windowStart = OffsetDateTime.now(BUSINESS_ZONE).plusHours(1);
        OffsetDateTime windowEnd = windowStart.plusDays(SLOT_LOOKAHEAD_DAYS);
        List<BookingEntity> bookings = bookingsDAO.findConfirmedBookingsInRange(organisation, windowStart, windowEnd);
        Map<DayOfWeek, OrganisationScheduleEntity> schedulesByDay = organisation.getSchedules().stream()
            .collect(Collectors.toMap(OrganisationScheduleEntity::getDayOfWeek, schedule -> schedule));
        int capacity = Math.max(1, organisation.getMembers().size() + 1);
        List<TimeSlot> slots = new java.util.ArrayList<>();

        for (int dayOffset = 0; dayOffset < SLOT_LOOKAHEAD_DAYS && slots.size() < limit; dayOffset++) {
            LocalDate date = LocalDate.now(BUSINESS_ZONE).plusDays(dayOffset);
            OrganisationScheduleEntity schedule = schedulesByDay.get(date.getDayOfWeek());
            if (schedule == null || !Boolean.TRUE.equals(schedule.getIsWorkingDay()) || schedule.getStartTime() == null || schedule.getEndTime() == null) {
                continue;
            }

            LocalDateTime cursor = LocalDateTime.of(date, schedule.getStartTime());
            LocalDateTime dayEnd = LocalDateTime.of(date, schedule.getEndTime());

            while (!cursor.plusMinutes(service.getDurationMinutes()).isAfter(dayEnd) && slots.size() < limit) {
                OffsetDateTime candidateStart = cursor.atZone(BUSINESS_ZONE).toOffsetDateTime();
                OffsetDateTime candidateEnd = candidateStart.plusMinutes(service.getDurationMinutes());

                if (!candidateStart.isBefore(windowStart) && isSlotAvailable(bookings, candidateStart, candidateEnd, capacity)) {
                    slots.add(new TimeSlot(
                        service.getId() + "_" + candidateStart.toInstant().toEpochMilli(),
                        candidateStart.format(SLOT_LABEL_FORMATTER),
                        candidateStart
                    ));
                }

                cursor = cursor.plusMinutes(schedule.getSlotStepMinutes());
            }
        }

        return slots;
    }

    public boolean isSlotAvailable(OrganisationEntity organisation, OrganisationServiceEntity service, OffsetDateTime startAt) {
        OffsetDateTime windowStart = startAt.minusMinutes(service.getDurationMinutes());
        OffsetDateTime windowEnd = startAt.plusMinutes(service.getDurationMinutes());
        List<BookingEntity> bookings = bookingsDAO.findConfirmedBookingsInRange(organisation, windowStart, windowEnd);
        int capacity = Math.max(1, organisation.getMembers().size() + 1);
        return !startAt.isBefore(OffsetDateTime.now(BUSINESS_ZONE).plusHours(1))
            && isSlotAvailable(bookings, startAt, startAt.plusMinutes(service.getDurationMinutes()), capacity);
    }

    private boolean isSlotAvailable(List<BookingEntity> bookings, OffsetDateTime startAt, OffsetDateTime endAt, int capacity) {
        long overlappingBookings = bookings.stream()
            .filter(booking -> booking.getStartAt().isBefore(endAt) && booking.getEndAt().isAfter(startAt))
            .count();
        return overlappingBookings < capacity;
    }
}