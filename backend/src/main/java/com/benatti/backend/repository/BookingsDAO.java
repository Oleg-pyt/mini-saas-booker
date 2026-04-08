package com.benatti.backend.repository;

import com.benatti.backend.entity.BookingEntity;
import com.benatti.backend.entity.OrganisationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface BookingsDAO extends JpaRepository<BookingEntity, Long> {
    @Query("""
        select booking from BookingEntity booking
        where booking.organisation = :organisation
          and booking.startAt < :rangeEnd
          and booking.endAt > :rangeStart
          and booking.status = 'CONFIRMED'
        order by booking.startAt asc
        """)
    List<BookingEntity> findConfirmedBookingsInRange(
        @Param("organisation") OrganisationEntity organisation,
        @Param("rangeStart") OffsetDateTime rangeStart,
        @Param("rangeEnd") OffsetDateTime rangeEnd
    );
}