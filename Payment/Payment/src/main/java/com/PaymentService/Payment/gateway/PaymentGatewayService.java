package com.PaymentService.Payment.gateway;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

public interface PaymentGatewayService {

    ChargeResult processCharge(BigDecimal amount, String currency, String token, Long bookingId);

    RefundResult processRefund(String gatewayTxnId, BigDecimal refundAmount, String reason);

    PayoutResult processPayout(BigDecimal amount, String currency, String destinationAccount);

    @Data
    @Builder
    class ChargeResult {
        private boolean successful;
        private String transactionId;
        private String failureReason;
    }

    @Data
    @Builder
    class RefundResult {
        private boolean successful;
        private String refundTransactionId;
        private String failureReason;
    }

    @Data
    @Builder
    class PayoutResult {
        private boolean successful;
        private String transferId;
        private String failureReason;
    }
}
