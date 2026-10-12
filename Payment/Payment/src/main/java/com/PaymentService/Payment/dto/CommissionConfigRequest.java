package com.PaymentService.Payment.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommissionConfigRequest {

    @NotNull(message = "commissionRate is required")
    @DecimalMin(value = "0.0000", message = "Commission rate cannot be negative")
    @DecimalMax(value = "1.0000", message = "Commission rate cannot exceed 1.0 (100%)")
    private BigDecimal commissionRate; // e.g. 0.1500 for 15%

    private BigDecimal minHourlyRate;
    private BigDecimal maxHourlyRate;
}
