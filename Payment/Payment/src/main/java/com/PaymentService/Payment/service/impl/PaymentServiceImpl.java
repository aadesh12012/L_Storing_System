package com.PaymentService.Payment.service.impl;

import com.PaymentService.Payment.dto.*;
import com.PaymentService.Payment.event.PaymentCompletedEvent;
import com.PaymentService.Payment.event.PaymentEventPublisher;
import com.PaymentService.Payment.event.PaymentRefundedEvent;
import com.PaymentService.Payment.exception.PaymentProcessingException;
import com.PaymentService.Payment.exception.ResourceNotFoundException;
import com.PaymentService.Payment.gateway.PaymentGatewayService;
import com.PaymentService.Payment.model.Payment;
import com.PaymentService.Payment.model.PaymentStatus;
import com.PaymentService.Payment.model.PayoutStatus;
import com.PaymentService.Payment.model.Refund;
import com.PaymentService.Payment.repository.PaymentRepository;
import com.PaymentService.Payment.repository.PayoutRepository;
import com.PaymentService.Payment.repository.RefundRepository;
import com.PaymentService.Payment.service.CommissionService;
import com.PaymentService.Payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final PayoutRepository payoutRepository;
    private final RefundRepository refundRepository;
    private final CommissionService commissionService;
    private final PaymentGatewayService gatewayService;
    private final PaymentEventPublisher eventPublisher;

    @Override
    public PaymentResponse processCharge(Long userId, ChargeRequest request) {
        log.info("Processing charge for bookingId={}, userId={}, amount={}",
                request.getBookingId(), userId, request.getAmount());

        // Idempotency check: see if a successful payment already exists for this booking
        paymentRepository.findByBookingId(request.getBookingId()).ifPresent(existing -> {
            if (existing.getStatus() == PaymentStatus.SUCCESS) {
                throw new IllegalStateException("Payment for booking " + request.getBookingId() + " has already been successfully processed.");
            }
        });

        BigDecimal commissionRate = commissionService.getEffectiveCommissionRate();
        BigDecimal commissionAmount = request.getAmount().multiply(commissionRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal providerEarnings = request.getAmount().subtract(commissionAmount).setScale(2, RoundingMode.HALF_UP);

        Payment payment = Payment.builder()
                .bookingId(request.getBookingId())
                .userId(userId)
                .providerId(request.getProviderId())
                .amount(request.getAmount())
                .commissionRate(commissionRate)
                .commissionAmount(commissionAmount)
                .providerEarnings(providerEarnings)
                .paymentMethod(request.getPaymentMethod())
                .currency("USD")
                .status(PaymentStatus.PROCESSING)
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        // Call Payment Gateway simulator
        PaymentGatewayService.ChargeResult result = gatewayService.processCharge(
                request.getAmount(),
                "USD",
                request.getPaymentToken(),
                request.getBookingId()
        );

        if (!result.isSuccessful()) {
            savedPayment.setStatus(PaymentStatus.FAILED);
            savedPayment.setFailureReason(result.getFailureReason());
            paymentRepository.save(savedPayment);
            log.error("Payment failed for booking {}: {}", request.getBookingId(), result.getFailureReason());
            throw new PaymentProcessingException("Payment failed: " + result.getFailureReason());
        }

        savedPayment.setStatus(PaymentStatus.SUCCESS);
        savedPayment.setGatewayTxnId(result.getTransactionId());
        Payment successfulPayment = paymentRepository.save(savedPayment);

        log.info("Payment successfully processed: id={}, txnId={}, commission={}, providerEarnings={}",
                successfulPayment.getId(), successfulPayment.getGatewayTxnId(), commissionAmount, providerEarnings);

        // Publish event for Booking Service to mark booking PAID, and Notification Service
        eventPublisher.publishPaymentCompleted(PaymentCompletedEvent.builder()
                .paymentId(successfulPayment.getId())
                .bookingId(successfulPayment.getBookingId())
                .userId(successfulPayment.getUserId())
                .providerId(successfulPayment.getProviderId())
                .amount(successfulPayment.getAmount())
                .commissionAmount(successfulPayment.getCommissionAmount())
                .providerEarnings(successfulPayment.getProviderEarnings())
                .currency(successfulPayment.getCurrency())
                .gatewayTxnId(successfulPayment.getGatewayTxnId())
                .timestamp(LocalDateTime.now())
                .build());

        return toResponse(successfulPayment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long paymentId) {
        return toResponse(findPaymentOrThrow(paymentId));
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByBookingId(Long bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("No payment found for booking ID: " + bookingId));
        return toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByUserId(Long userId) {
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByProviderId(Long providerId) {
        return paymentRepository.findByProviderIdOrderByCreatedAtDesc(providerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllPayments() {
        return paymentRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public RefundResponse refundPayment(Long paymentId, Long adminId, RefundRequest request) {
        Payment payment = findPaymentOrThrow(paymentId);

        if (payment.getStatus() != PaymentStatus.SUCCESS && payment.getStatus() != PaymentStatus.PARTIALLY_REFUNDED) {
            throw new IllegalStateException("Only successful payments can be refunded. Current status: " + payment.getStatus());
        }

        BigDecimal availableToRefund = payment.getAmount().subtract(payment.getRefundedAmount());
        if (request.getAmount().compareTo(availableToRefund) > 0) {
            throw new IllegalArgumentException("Refund amount " + request.getAmount() +
                    " exceeds available refundable amount " + availableToRefund);
        }

        // Call gateway refund
        PaymentGatewayService.RefundResult result = gatewayService.processRefund(
                payment.getGatewayTxnId(),
                request.getAmount(),
                request.getReason()
        );

        if (!result.isSuccessful()) {
            throw new PaymentProcessingException("Gateway refund failed: " + result.getFailureReason());
        }

        BigDecimal newRefundedAmount = payment.getRefundedAmount().add(request.getAmount());
        payment.setRefundedAmount(newRefundedAmount);
        if (newRefundedAmount.compareTo(payment.getAmount()) >= 0) {
            payment.setStatus(PaymentStatus.REFUNDED);
        } else {
            payment.setStatus(PaymentStatus.PARTIALLY_REFUNDED);
        }

        Payment updatedPayment = paymentRepository.save(payment);

        Refund refund = Refund.builder()
                .payment(updatedPayment)
                .bookingId(updatedPayment.getBookingId())
                .amount(request.getAmount())
                .reason(request.getReason())
                .initiatedByAdminId(adminId)
                .gatewayRefundId(result.getRefundTransactionId())
                .build();

        Refund savedRefund = refundRepository.save(refund);
        log.info("Payment {} refunded by admin {}: amount={}, gatewayRefundId={}",
                paymentId, adminId, request.getAmount(), result.getRefundTransactionId());

        eventPublisher.publishPaymentRefunded(PaymentRefundedEvent.builder()
                .refundId(savedRefund.getId())
                .paymentId(paymentId)
                .bookingId(updatedPayment.getBookingId())
                .amount(savedRefund.getAmount())
                .reason(savedRefund.getReason())
                .initiatedByAdminId(adminId)
                .gatewayRefundId(savedRefund.getGatewayRefundId())
                .timestamp(LocalDateTime.now())
                .build());

        return RefundResponse.builder()
                .id(savedRefund.getId())
                .paymentId(paymentId)
                .bookingId(updatedPayment.getBookingId())
                .amount(savedRefund.getAmount())
                .reason(savedRefund.getReason())
                .initiatedByAdminId(adminId)
                .gatewayRefundId(savedRefund.getGatewayRefundId())
                .createdAt(savedRefund.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminTransactionStatsResponse getPlatformStats() {
        List<Payment> allPayments = paymentRepository.findAll();
        BigDecimal gmv = paymentRepository.sumTotalGmvByStatus(PaymentStatus.SUCCESS);
        BigDecimal commission = paymentRepository.sumTotalCommissionByStatus(PaymentStatus.SUCCESS);
        BigDecimal totalPayouts = payoutRepository.findAll().stream()
                .filter(p -> p.getStatus() == PayoutStatus.PAID)
                .map(com.PaymentService.Payment.model.Payout::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalProviderEarnings = paymentRepository.sumProviderEarningsByProviderIdAndStatus(null, PaymentStatus.SUCCESS);
        // If query returns zero or null, calculate from total payments
        if (totalProviderEarnings == null || totalProviderEarnings.compareTo(BigDecimal.ZERO) == 0) {
            totalProviderEarnings = gmv.subtract(commission);
        }

        BigDecimal pendingProviderEarnings = totalProviderEarnings.subtract(totalPayouts);
        if (pendingProviderEarnings.compareTo(BigDecimal.ZERO) < 0) {
            pendingProviderEarnings = BigDecimal.ZERO;
        }

        return AdminTransactionStatsResponse.builder()
                .totalTransactionsCount(allPayments.size())
                .grossMarketplaceVolume(gmv)
                .totalPlatformCommission(commission)
                .totalProviderPayouts(totalPayouts)
                .pendingProviderEarnings(pendingProviderEarnings)
                .build();
    }

    private Payment findPaymentOrThrow(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with ID: " + id));
    }

    private PaymentResponse toResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .bookingId(payment.getBookingId())
                .userId(payment.getUserId())
                .providerId(payment.getProviderId())
                .amount(payment.getAmount())
                .commissionRate(payment.getCommissionRate())
                .commissionAmount(payment.getCommissionAmount())
                .providerEarnings(payment.getProviderEarnings())
                .status(payment.getStatus())
                .paymentMethod(payment.getPaymentMethod())
                .currency(payment.getCurrency())
                .gatewayTxnId(payment.getGatewayTxnId())
                .refundedAmount(payment.getRefundedAmount())
                .failureReason(payment.getFailureReason())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}
