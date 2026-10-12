package com.PaymentService.Payment.service;

import com.PaymentService.Payment.dto.*;

import java.util.List;

public interface PaymentService {

    PaymentResponse processCharge(Long userId, ChargeRequest request);

    PaymentResponse getPaymentById(Long paymentId);

    PaymentResponse getPaymentByBookingId(Long bookingId);

    List<PaymentResponse> getPaymentsByUserId(Long userId);

    List<PaymentResponse> getPaymentsByProviderId(Long providerId);

    List<PaymentResponse> getAllPayments();

    RefundResponse refundPayment(Long paymentId, Long adminId, RefundRequest request);

    AdminTransactionStatsResponse getPlatformStats();
}
