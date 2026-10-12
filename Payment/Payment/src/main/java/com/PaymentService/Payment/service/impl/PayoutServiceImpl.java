package com.PaymentService.Payment.service.impl;

import com.PaymentService.Payment.dto.PayoutRequest;
import com.PaymentService.Payment.dto.PayoutResponse;
import com.PaymentService.Payment.dto.ProviderEarningsResponse;
import com.PaymentService.Payment.gateway.PaymentGatewayService;
import com.PaymentService.Payment.model.Payment;
import com.PaymentService.Payment.model.PaymentStatus;
import com.PaymentService.Payment.model.Payout;
import com.PaymentService.Payment.model.PayoutStatus;
import com.PaymentService.Payment.repository.PaymentRepository;
import com.PaymentService.Payment.repository.PayoutRepository;
import com.PaymentService.Payment.service.PayoutService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PayoutServiceImpl implements PayoutService {

    private final PaymentRepository paymentRepository;
    private final PayoutRepository payoutRepository;
    private final PaymentGatewayService gatewayService;

    @Override
    @Transactional(readOnly = true)
    public ProviderEarningsResponse getProviderEarnings(Long providerId) {
        List<Payment> payments = paymentRepository.findByProviderIdOrderByCreatedAtDesc(providerId)
                .stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .toList();

        BigDecimal gross = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal commission = payments.stream()
                .map(Payment::getCommissionAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netEarnings = payments.stream()
                .map(Payment::getProviderEarnings)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal paidOut = payoutRepository.findByProviderIdOrderByCreatedAtDesc(providerId)
                .stream()
                .filter(p -> p.getStatus() == PayoutStatus.PAID)
                .map(Payout::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal available = netEarnings.subtract(paidOut);
        if (available.compareTo(BigDecimal.ZERO) < 0) {
            available = BigDecimal.ZERO;
        }

        return ProviderEarningsResponse.builder()
                .providerId(providerId)
                .totalGrossEarnings(gross)
                .totalCommissionPaid(commission)
                .totalNetEarnings(netEarnings)
                .totalPaidOut(paidOut)
                .availablePayoutBalance(available)
                .completedPaymentsCount(payments.size())
                .build();
    }

    @Override
    public PayoutResponse requestPayout(Long providerId, PayoutRequest request) {
        ProviderEarningsResponse earnings = getProviderEarnings(providerId);

        BigDecimal payoutAmount = (request.getAmount() != null)
                ? request.getAmount()
                : earnings.getAvailablePayoutBalance();

        if (payoutAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("No funds available for payout.");
        }

        if (payoutAmount.compareTo(earnings.getAvailablePayoutBalance()) > 0) {
            throw new IllegalArgumentException("Requested payout amount " + payoutAmount +
                    " exceeds available balance " + earnings.getAvailablePayoutBalance());
        }

        String destination = (request.getDestinationAccount() != null && !request.getDestinationAccount().isBlank())
                ? request.getDestinationAccount()
                : "stripe_default_connected_acc_" + providerId;

        // Call Gateway to process Stripe Connect payout transfer
        PaymentGatewayService.PayoutResult result = gatewayService.processPayout(
                payoutAmount,
                "USD",
                destination
        );

        Payout payout = Payout.builder()
                .providerId(providerId)
                .amount(payoutAmount)
                .payoutMethod(request.getPayoutMethod() != null ? request.getPayoutMethod() : "STRIPE_CONNECT")
                .destinationAccount(destination)
                .referenceId(result.getTransferId())
                .scheduledDate(LocalDate.now())
                .processedAt(LocalDateTime.now())
                .status(result.isSuccessful() ? PayoutStatus.PAID : PayoutStatus.FAILED)
                .build();

        Payout saved = payoutRepository.save(payout);
        log.info("Payout {} processed for provider {}: amount={}, status={}, ref={}",
                saved.getId(), providerId, payoutAmount, saved.getStatus(), saved.getReferenceId());

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PayoutResponse> getPayoutsByProviderId(Long providerId) {
        return payoutRepository.findByProviderIdOrderByCreatedAtDesc(providerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PayoutResponse> getAllPayouts() {
        return payoutRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private PayoutResponse toResponse(Payout payout) {
        return PayoutResponse.builder()
                .id(payout.getId())
                .providerId(payout.getProviderId())
                .amount(payout.getAmount())
                .status(payout.getStatus())
                .payoutMethod(payout.getPayoutMethod())
                .destinationAccount(payout.getDestinationAccount())
                .referenceId(payout.getReferenceId())
                .scheduledDate(payout.getScheduledDate())
                .processedAt(payout.getProcessedAt())
                .createdAt(payout.getCreatedAt())
                .build();
    }
}
