package com.PaymentService.Payment.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProviderEarningsResponse {

    private Long providerId;
    private BigDecimal totalGrossEarnings;     // sum of completed payments amount
    private BigDecimal totalCommissionPaid;    // platform cut
    private BigDecimal totalNetEarnings;       // gross minus commission
    private BigDecimal totalPaidOut;           // already paid out via Payouts
    private BigDecimal availablePayoutBalance; // net earnings - paid out
    private long completedPaymentsCount;
}
