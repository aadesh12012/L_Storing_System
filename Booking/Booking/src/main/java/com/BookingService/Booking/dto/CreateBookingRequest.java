package com.BookingService.Booking.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Request DTO for creating a new booking (U-6).
 */
@Data
public class CreateBookingRequest {

    @NotNull(message = "Provider ID is required")
    private Long providerId;

    @NotNull(message = "Location ID is required")
    private Long locationId;

    @NotNull(message = "Expected drop-off time is required")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime expectedDropOffTime;

    @NotNull(message = "Expected pickup time is required")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime expectedPickupTime;

    @NotNull(message = "Hourly rate is required")
    @DecimalMin(value = "0.01", message = "Hourly rate must be positive")
    private BigDecimal hourlyRate;

    private String specialInstructions;

    @NotEmpty(message = "At least one luggage item must be specified")
    @Valid
    private List<LuggageItemDto> items;
}
