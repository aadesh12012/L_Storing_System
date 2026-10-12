package com.PaymentService.Payment.dto;

import com.PaymentService.Payment.model.PayoutStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayoutResponse {

    private Long id;
    private Long providerId;
    private BigDecimal amount;
    private PayoutStatus status;
    private String payoutMethod;
    private String destinationAccount;
    private String referenceId;
    private LocalDate scheduledDate;
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;
}
