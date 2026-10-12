package com.BookingService.Booking.service.impl;

import com.BookingService.Booking.dto.BookingResponse;
import com.BookingService.Booking.dto.CostEstimateResponse;
import com.BookingService.Booking.dto.CreateBookingRequest;
import com.BookingService.Booking.dto.LuggageItemDto;
import com.BookingService.Booking.model.Booking;
import com.BookingService.Booking.model.BookingStatus;
import com.BookingService.Booking.model.LuggageItem;
import com.BookingService.Booking.repository.BookingRepository;
import com.BookingService.Booking.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Implementation of {@link BookingService}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;

    @Override
    public BookingResponse createBooking(Long userId, CreateBookingRequest request) {
        if (!request.getExpectedPickupTime().isAfter(request.getExpectedDropOffTime())) {
            throw new IllegalArgumentException("Expected pickup time must be after expected drop-off time");
        }

        double durationHours = calculateDurationInHours(
                request.getExpectedDropOffTime(),
                request.getExpectedPickupTime()
        );

        int luggageCount = request.getItems().size();
        BigDecimal estimatedAmount = calculateCost(request.getHourlyRate(), luggageCount, durationHours);

        Booking booking = Booking.builder()
                .userId(userId)
                .providerId(request.getProviderId())
                .locationId(request.getLocationId())
                .status(BookingStatus.PENDING_APPROVAL)
                .luggageCount(luggageCount)
                .expectedDropOffTime(request.getExpectedDropOffTime())
                .expectedPickupTime(request.getExpectedPickupTime())
                .hourlyRate(request.getHourlyRate())
                .estimatedAmount(estimatedAmount)
                .specialInstructions(request.getSpecialInstructions())
                .build();

        for (LuggageItemDto itemDto : request.getItems()) {
            LuggageItem item = LuggageItem.builder()
                    .size(itemDto.getSize())
                    .type(itemDto.getType())
                    .description(itemDto.getDescription())
                    .photoUrl(itemDto.getPhotoUrl())
                    .build();
            booking.addLuggageItem(item);
        }

        Booking saved = bookingRepository.save(booking);
        log.info("Booking created: id={}, user={}, provider={}, estimatedAmount={}",
                saved.getId(), userId, request.getProviderId(), estimatedAmount);

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long bookingId) {
        return toResponse(findOrThrow(bookingId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByUserId(Long userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByProviderId(Long providerId, BookingStatus status) {
        List<Booking> bookings = (status != null)
                ? bookingRepository.findByProviderIdAndStatus(providerId, status)
                : bookingRepository.findByProviderIdOrderByCreatedAtDesc(providerId);

        return bookings.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings(BookingStatus status) {
        List<Booking> bookings = (status != null)
                ? bookingRepository.findByStatus(status)
                : bookingRepository.findAll();

        return bookings.stream().map(this::toResponse).toList();
    }

    @Override
    public BookingResponse approveBooking(Long bookingId, Long providerId) {
        Booking booking = findOrThrow(bookingId);
        validateProvider(booking, providerId);

        if (booking.getStatus() != BookingStatus.PENDING_APPROVAL && booking.getStatus() != BookingStatus.REQUESTED) {
            throw new IllegalStateException("Only pending or requested bookings can be approved. Current status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.APPROVED);
        Booking updated = bookingRepository.save(booking);
        log.info("Booking {} approved by provider {}", bookingId, providerId);
        return toResponse(updated);
    }

    @Override
    public BookingResponse declineBooking(Long bookingId, Long providerId, String reason) {
        Booking booking = findOrThrow(bookingId);
        validateProvider(booking, providerId);

        if (booking.getStatus() != BookingStatus.PENDING_APPROVAL && booking.getStatus() != BookingStatus.REQUESTED) {
            throw new IllegalStateException("Only pending bookings can be declined. Current status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.DECLINED);
        booking.setCancellationReason(reason != null ? reason : "Declined by provider");
        Booking updated = bookingRepository.save(booking);
        log.info("Booking {} declined by provider {}: {}", bookingId, providerId, reason);
        return toResponse(updated);
    }

    @Override
    public BookingResponse checkIn(Long bookingId, Long providerId) {
        Booking booking = findOrThrow(bookingId);
        validateProvider(booking, providerId);

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new IllegalStateException("Only approved bookings can be checked in. Current status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.ACTIVE);
        booking.setActualDropOffTime(LocalDateTime.now());
        Booking updated = bookingRepository.save(booking);
        log.info("Booking {} checked in (ACTIVE) by provider {}", bookingId, providerId);
        return toResponse(updated);
    }

    @Override
    public BookingResponse checkOut(Long bookingId, Long providerId) {
        Booking booking = findOrThrow(bookingId);
        validateProvider(booking, providerId);

        if (booking.getStatus() != BookingStatus.ACTIVE) {
            throw new IllegalStateException("Only active bookings can be checked out. Current status: " + booking.getStatus());
        }

        LocalDateTime dropOffTime = booking.getActualDropOffTime() != null
                ? booking.getActualDropOffTime()
                : booking.getExpectedDropOffTime();
        LocalDateTime now = LocalDateTime.now();

        double actualHours = calculateDurationInHours(dropOffTime, now);
        BigDecimal totalAmount = calculateCost(booking.getHourlyRate(), booking.getLuggageCount(), actualHours);

        booking.setActualPickupTime(now);
        booking.setTotalAmount(totalAmount);
        booking.setStatus(BookingStatus.COMPLETED);

        Booking updated = bookingRepository.save(booking);
        log.info("Booking {} completed (checked out): durationHours={}, totalAmount={}",
                bookingId, actualHours, totalAmount);
        return toResponse(updated);
    }

    @Override
    public BookingResponse cancelBooking(Long bookingId, Long requesterId, String reason, boolean isAdmin) {
        Booking booking = findOrThrow(bookingId);

        if (!isAdmin) {
            if (!booking.getUserId().equals(requesterId)) {
                throw new IllegalArgumentException("User is not authorized to cancel this booking");
            }
            if (booking.getStatus() == BookingStatus.ACTIVE ||
                booking.getStatus() == BookingStatus.COMPLETED ||
                booking.getStatus() == BookingStatus.PAID ||
                booking.getStatus() == BookingStatus.CANCELLED ||
                booking.getStatus() == BookingStatus.DECLINED) {
                throw new IllegalStateException("Cannot cancel booking in status: " + booking.getStatus());
            }
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationReason(reason != null ? reason : "Cancelled by " + (isAdmin ? "Admin" : "User"));
        Booking updated = bookingRepository.save(booking);
        log.info("Booking {} cancelled by {}: reason={}", bookingId, isAdmin ? "admin" : "user " + requesterId, reason);
        return toResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public CostEstimateResponse getCostEstimate(Long bookingId) {
        Booking booking = findOrThrow(bookingId);

        LocalDateTime start;
        LocalDateTime end;

        if (booking.getStatus() == BookingStatus.ACTIVE) {
            start = booking.getActualDropOffTime() != null ? booking.getActualDropOffTime() : booking.getExpectedDropOffTime();
            end = LocalDateTime.now();
        } else if (booking.getActualPickupTime() != null) {
            start = booking.getActualDropOffTime() != null ? booking.getActualDropOffTime() : booking.getExpectedDropOffTime();
            end = booking.getActualPickupTime();
        } else {
            start = booking.getExpectedDropOffTime();
            end = booking.getExpectedPickupTime();
        }

        double durationHours = calculateDurationInHours(start, end);
        BigDecimal cost = calculateCost(booking.getHourlyRate(), booking.getLuggageCount(), durationHours);

        return CostEstimateResponse.builder()
                .bookingId(booking.getId())
                .status(booking.getStatus())
                .luggageCount(booking.getLuggageCount())
                .hourlyRate(booking.getHourlyRate())
                .durationHours(durationHours)
                .calculatedAmount(cost)
                .build();
    }

    // ── Helper methods ────────────────────────────────────────────────────────

    private Booking findOrThrow(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with ID: " + id));
    }

    private void validateProvider(Booking booking, Long providerId) {
        if (!booking.getProviderId().equals(providerId)) {
            throw new IllegalArgumentException("Provider mismatch: booking belongs to provider " + booking.getProviderId());
        }
    }

    private double calculateDurationInHours(LocalDateTime start, LocalDateTime end) {
        long minutes = Math.max(60L, Duration.between(start, end).toMinutes());
        // Hourly charge: ceiling to nearest full hour, minimum 1 hour
        return Math.ceil(minutes / 60.0);
    }

    private BigDecimal calculateCost(BigDecimal hourlyRate, int luggageCount, double hours) {
        return hourlyRate
                .multiply(BigDecimal.valueOf(luggageCount))
                .multiply(BigDecimal.valueOf(hours))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BookingResponse toResponse(Booking booking) {
        List<LuggageItemDto> items = booking.getLuggageItems().stream()
                .map(item -> LuggageItemDto.builder()
                        .id(item.getId())
                        .size(item.getSize())
                        .type(item.getType())
                        .description(item.getDescription())
                        .photoUrl(item.getPhotoUrl())
                        .build())
                .toList();

        return BookingResponse.builder()
                .id(booking.getId())
                .userId(booking.getUserId())
                .providerId(booking.getProviderId())
                .locationId(booking.getLocationId())
                .status(booking.getStatus())
                .luggageCount(booking.getLuggageCount())
                .expectedDropOffTime(booking.getExpectedDropOffTime())
                .expectedPickupTime(booking.getExpectedPickupTime())
                .actualDropOffTime(booking.getActualDropOffTime())
                .actualPickupTime(booking.getActualPickupTime())
                .hourlyRate(booking.getHourlyRate())
                .estimatedAmount(booking.getEstimatedAmount())
                .totalAmount(booking.getTotalAmount())
                .specialInstructions(booking.getSpecialInstructions())
                .cancellationReason(booking.getCancellationReason())
                .items(items)
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }
}
