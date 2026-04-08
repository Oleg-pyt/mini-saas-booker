package com.benatti.backend.controller;

import com.benatti.api.BookingsApi;
import com.benatti.api.model.BookingConfirmationResponse;
import com.benatti.api.model.BookingCreateRequest;
import com.benatti.backend.service.BookingApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BookingsController implements BookingsApi {
    private final BookingApplicationService bookingApplicationService;

    public BookingsController(BookingApplicationService bookingApplicationService) {
        this.bookingApplicationService = bookingApplicationService;
    }

    @Override
    public ResponseEntity<BookingConfirmationResponse> createBooking(@Valid @RequestBody BookingCreateRequest bookingCreateRequest) {
        Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        BookingConfirmationResponse response = bookingApplicationService.createBooking(bookingCreateRequest, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}