package com.PaymentService.Payment.dto;

import jakarta.validation.constraints.DecimalMin;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayoutRequest {

    @DecimalMin(value = "1.00", message = "Minimum payout amount is 1.00")
    private BigDecimal amount; // If null, request pays out full available balance

    @Builder.Default
    private String payoutMethod = "STRIPE_CONNECT";

    private String destinationAccount; // e.g. "acct_123456789"
}
