package com.BookingService.Booking.service;

import com.BookingService.Booking.dto.BookingResponse;
import com.BookingService.Booking.dto.CostEstimateResponse;
import com.BookingService.Booking.dto.CreateBookingRequest;
import com.BookingService.Booking.model.BookingStatus;

import java.util.List;

/**
 * Service contract for managing luggage storage bookings and lifecycle.
 */
public interface BookingService {

    /** Create a new booking request (U-6). */
    BookingResponse createBooking(Long userId, CreateBookingRequest request);

    /** Fetch booking details by ID (U-7). */
    BookingResponse getBookingById(Long bookingId);

    /** Fetch all bookings for a user (U-7). */
    List<BookingResponse> getBookingsByUserId(Long userId);

    /** Fetch all bookings for a provider, optionally filtered by status (P-5, P-9). */
    List<BookingResponse> getBookingsByProviderId(Long providerId, BookingStatus status);

    /** Admin: fetch all bookings across the platform (A-3). */
    List<BookingResponse> getAllBookings(BookingStatus status);

    /** Provider: approve an incoming booking request (P-6). */
    BookingResponse approveBooking(Long bookingId, Long providerId);

    /** Provider: decline an incoming booking request (P-6). */
    BookingResponse declineBooking(Long bookingId, Long providerId, String reason);

    /** Provider: mark booking as active upon receiving luggage physically (P-7). */
    BookingResponse checkIn(Long bookingId, Long providerId);

    /** Provider: mark booking as completed upon luggage pickup, computing final cost (P-8, U-10). */
    BookingResponse checkOut(Long bookingId, Long providerId);

    /** User or Admin: cancel booking before active or via admin override (U-9, A-4). */
    BookingResponse cancelBooking(Long bookingId, Long requesterId, String reason, boolean isAdmin);

    /** Calculate real-time cost estimate for an active or planned booking (U-13). */
    CostEstimateResponse getCostEstimate(Long bookingId);
}
