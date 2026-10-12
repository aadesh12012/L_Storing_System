package com.BookingService.Booking.dto;

import com.BookingService.Booking.model.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for real-time running cost estimate of a booking (U-13).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostEstimateResponse {

    private Long bookingId;
    private BookingStatus status;
    private Integer luggageCount;
    private BigDecimal hourlyRate;
    private Double durationHours;
    private BigDecimal calculatedAmount;
}
