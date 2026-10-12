package com.BookingService.Booking.controller;

import com.BookingService.Booking.dto.BookingResponse;
import com.BookingService.Booking.dto.CostEstimateResponse;
import com.BookingService.Booking.dto.CreateBookingRequest;
import com.BookingService.Booking.model.BookingStatus;
import com.BookingService.Booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for luggage storage booking operations and state machine transitions.
 *
 * <pre>
 *  POST   /api/v1/bookings                      → create booking request (U-6)
 *  GET    /api/v1/bookings/{id}                 → get booking by ID (U-7)
 *  GET    /api/v1/bookings/user/{userId}        → list user's bookings (U-7)
 *  GET    /api/v1/bookings/provider/{providerId}→ list provider's bookings (P-5, P-9)
 *  GET    /api/v1/bookings                      → admin list all bookings (A-3)
 *  PATCH  /api/v1/bookings/{id}/approve         → provider approves (P-6)
 *  PATCH  /api/v1/bookings/{id}/decline         → provider declines (P-6)
 *  PATCH  /api/v1/bookings/{id}/check-in        → provider checks in luggage (P-7)
 *  PATCH  /api/v1/bookings/{id}/check-out       → provider checks out & bills (P-8, U-10)
 *  PATCH  /api/v1/bookings/{id}/cancel          → user or admin cancel (U-9, A-4)
 *  GET    /api/v1/bookings/{id}/cost-estimate   → real-time cost estimate (U-13)
 * </pre>
 */
@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestParam(value = "userId", required = false) Long paramUserId,
            @Valid @RequestBody CreateBookingRequest request) {

        Long effectiveUserId = headerUserId != null ? headerUserId : paramUserId;
        if (effectiveUserId == null) {
            throw new IllegalArgumentException("User ID must be provided via X-User-Id header or query parameter");
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.createBooking(effectiveUserId, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BookingResponse>> getBookingsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(bookingService.getBookingsByUserId(userId));
    }

    @GetMapping("/provider/{providerId}")
    public ResponseEntity<List<BookingResponse>> getBookingsByProviderId(
            @PathVariable Long providerId,
            @RequestParam(required = false) BookingStatus status) {
        return ResponseEntity.ok(bookingService.getBookingsByProviderId(providerId, status));
    }

    @GetMapping
    public ResponseEntity<List<BookingResponse>> getAllBookings(
            @RequestParam(required = false) BookingStatus status) {
        return ResponseEntity.ok(bookingService.getAllBookings(status));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<BookingResponse> approveBooking(
            @PathVariable Long id,
            @RequestParam Long providerId) {
        return ResponseEntity.ok(bookingService.approveBooking(id, providerId));
    }

    @PatchMapping("/{id}/decline")
    public ResponseEntity<BookingResponse> declineBooking(
            @PathVariable Long id,
            @RequestParam Long providerId,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(bookingService.declineBooking(id, providerId, reason));
    }

    @PatchMapping("/{id}/check-in")
    public ResponseEntity<BookingResponse> checkIn(
            @PathVariable Long id,
            @RequestParam Long providerId) {
        return ResponseEntity.ok(bookingService.checkIn(id, providerId));
    }

    @PatchMapping("/{id}/check-out")
    public ResponseEntity<BookingResponse> checkOut(
            @PathVariable Long id,
            @RequestParam Long providerId) {
        return ResponseEntity.ok(bookingService.checkOut(id, providerId));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable Long id,
            @RequestParam Long requesterId,
            @RequestParam(required = false) String reason,
            @RequestParam(defaultValue = "false") boolean isAdmin) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, requesterId, reason, isAdmin));
    }

    @GetMapping("/{id}/cost-estimate")
    public ResponseEntity<CostEstimateResponse> getCostEstimate(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getCostEstimate(id));
    }
}
