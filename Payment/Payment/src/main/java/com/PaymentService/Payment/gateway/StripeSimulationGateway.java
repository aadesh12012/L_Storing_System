package com.PaymentService.Payment.gateway;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * High-fidelity simulator for third-party payment gateway (Stripe Connect).
 * Handles PCI-compliant tokenized charges, refunds, and provider transfers.
 */
@Service
@Slf4j
public class StripeSimulationGateway implements PaymentGatewayService {

    @Override
    public ChargeResult processCharge(BigDecimal amount, String currency, String token, Long bookingId) {
        log.info("Simulating Stripe PaymentIntent capture: amount={} {}, bookingId={}, token={}",
                amount, currency, bookingId, token != null ? "***" : "none");

        // Simulate simulated test decline if explicit failure token provided
        if ("tok_chargeDeclined".equalsIgnoreCase(token)) {
            log.warn("Simulated payment decline for booking {}", bookingId);
            return ChargeResult.builder()
                    .successful(false)
                    .failureReason("Your card was declined by the issuing bank (Test simulation)")
                    .build();
        }

        if ("tok_insufficientFunds".equalsIgnoreCase(token)) {
            log.warn("Simulated insufficient funds for booking {}", bookingId);
            return ChargeResult.builder()
                    .successful(false)
                    .failureReason("Your card has insufficient funds (Test simulation)")
                    .build();
        }

        // Realistic Stripe Charge ID: ch_...
        String chargeId = "ch_" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        log.info("Stripe charge succeeded: chargeId={}, amount={} {}", chargeId, amount, currency);

        return ChargeResult.builder()
                .successful(true)
                .transactionId(chargeId)
                .build();
    }

    @Override
    public RefundResult processRefund(String gatewayTxnId, BigDecimal refundAmount, String reason) {
        log.info("Simulating Stripe Refund: txnId={}, amount={}, reason={}", gatewayTxnId, refundAmount, reason);

        if (gatewayTxnId == null || gatewayTxnId.isBlank()) {
            return RefundResult.builder()
                    .successful(false)
                    .failureReason("Original gateway transaction ID is missing")
                    .build();
        }

        // Realistic Stripe Refund ID: re_...
        String refundId = "re_" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        log.info("Stripe refund succeeded: refundId={}, amount={}", refundId, refundAmount);

        return RefundResult.builder()
                .successful(true)
                .refundTransactionId(refundId)
                .build();
    }

    @Override
    public PayoutResult processPayout(BigDecimal amount, String currency, String destinationAccount) {
        log.info("Simulating Stripe Connect Transfer / Payout: amount={} {}, destination={}",
                amount, currency, destinationAccount);

        // Realistic Stripe Transfer ID: tr_...
        String transferId = "tr_" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        log.info("Stripe payout dispatch succeeded: transferId={}, amount={}", transferId, amount);

        return PayoutResult.builder()
                .successful(true)
                .transferId(transferId)
                .build();
    }
}
