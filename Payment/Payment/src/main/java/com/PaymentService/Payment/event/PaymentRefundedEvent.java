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
public class PaymentRefundedEvent {
    private Long refundId;
    private Long paymentId;
    private Long bookingId;
    private BigDecimal amount;
    private String reason;
    private Long initiatedByAdminId;
    private String gatewayRefundId;
    private LocalDateTime timestamp;
}
