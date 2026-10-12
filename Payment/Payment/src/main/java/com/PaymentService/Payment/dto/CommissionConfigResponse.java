package com.PaymentService.Payment.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommissionConfigResponse {

    private Long id;
    private BigDecimal commissionRate;
    private String commissionPercentage; // e.g. "15.00%"
    private BigDecimal minHourlyRate;
    private BigDecimal maxHourlyRate;
    private Long updatedByAdminId;
    private LocalDateTime updatedAt;
}
