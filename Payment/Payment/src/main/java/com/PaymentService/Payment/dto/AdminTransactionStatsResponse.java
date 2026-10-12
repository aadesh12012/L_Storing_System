package com.PaymentService.Payment.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminTransactionStatsResponse {

    private long totalTransactionsCount;
    private BigDecimal grossMarketplaceVolume; // Total value of completed transactions
    private BigDecimal totalPlatformCommission; // Revenue earned by platform
    private BigDecimal totalProviderPayouts;   // Total paid out to providers
    private BigDecimal pendingProviderEarnings; // Earnings waiting to be paid out
}
