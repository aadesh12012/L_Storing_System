package com.PaymentService.Payment.service;

import com.PaymentService.Payment.dto.PayoutRequest;
import com.PaymentService.Payment.dto.PayoutResponse;
import com.PaymentService.Payment.dto.ProviderEarningsResponse;

import java.util.List;

public interface PayoutService {

    ProviderEarningsResponse getProviderEarnings(Long providerId);

    PayoutResponse requestPayout(Long providerId, PayoutRequest request);

    List<PayoutResponse> getPayoutsByProviderId(Long providerId);

    List<PayoutResponse> getAllPayouts();
}
