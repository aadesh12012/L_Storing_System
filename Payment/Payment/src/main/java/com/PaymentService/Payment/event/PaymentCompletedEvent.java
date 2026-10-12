package com.PaymentService.Payment.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentCompletedEvent {
    private Long paymentId;
    private Long bookingId;
    private Long userId;
    private Long providerId;
    private BigDecimal amount;
    private BigDecimal commissionAmount;
    private BigDecimal providerEarnings;
    private String currency;
    private String gatewayTxnId;
    private LocalDateTime timestamp;
}
