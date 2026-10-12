package com.PaymentService.Payment.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundResponse {

    private Long id;
    private Long paymentId;
    private Long bookingId;
    private BigDecimal amount;
    private String reason;
    private Long initiatedByAdminId;
    private String gatewayRefundId;
    private LocalDateTime createdAt;
}
