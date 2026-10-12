package com.PaymentService.Payment.dto;

import com.PaymentService.Payment.model.PaymentMethod;
import com.PaymentService.Payment.model.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {

    private Long id;
    private Long bookingId;
    private Long userId;
    private Long providerId;
    private BigDecimal amount;
    private BigDecimal commissionRate;
    private BigDecimal commissionAmount;
    private BigDecimal providerEarnings;
    private PaymentStatus status;
    private PaymentMethod paymentMethod;
    private String currency;
    private String gatewayTxnId;
    private BigDecimal refundedAmount;
    private String failureReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
