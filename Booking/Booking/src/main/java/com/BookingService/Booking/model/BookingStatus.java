package com.BookingService.Booking.model;

/**
 * State machine statuses representing the lifecycle of a booking.
 * <pre>
 * REQUESTED / PENDING_APPROVAL → APPROVED → ACTIVE → COMPLETED → PAID
 *                              ↘ DECLINED
 * (before ACTIVE)             → CANCELLED
 * </pre>
 */
public enum BookingStatus {
    REQUESTED,
    PENDING_APPROVAL,
    APPROVED,
    DECLINED,
    ACTIVE,
    COMPLETED,
    PAID,
    CANCELLED
}
