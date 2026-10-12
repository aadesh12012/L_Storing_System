package com.PaymentService.Payment.controller;

import com.PaymentService.Payment.dto.PayoutRequest;
import com.PaymentService.Payment.dto.PayoutResponse;
import com.PaymentService.Payment.dto.ProviderEarningsResponse;
import com.PaymentService.Payment.service.PayoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payments/provider")
@RequiredArgsConstructor
@Tag(name = "Provider Payouts & Earnings", description = "Endpoints for provider earnings overview and payout scheduling (P-9, P-10)")
public class PayoutController {

    private final PayoutService payoutService;

    @GetMapping("/{providerId}/earnings")
    @Operation(summary = "View provider total earnings, platform fee deductions, and available balance (P-9)")
    public ResponseEntity<ProviderEarningsResponse> getEarnings(@PathVariable Long providerId) {
        return ResponseEntity.ok(payoutService.getProviderEarnings(providerId));
    }

    @PostMapping("/{providerId}/payouts")
    @Operation(summary = "Request a payout to provider's destination account or Stripe Connect (P-10)")
    public ResponseEntity<PayoutResponse> requestPayout(
            @PathVariable Long providerId,
            @Valid @RequestBody(required = false) PayoutRequest request) {

        PayoutRequest req = request != null ? request : new PayoutRequest();
        PayoutResponse response = payoutService.requestPayout(providerId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{providerId}/payouts")
    @Operation(summary = "View provider payout schedule and historical payouts (P-10)")
    public ResponseEntity<List<PayoutResponse>> getPayouts(@PathVariable Long providerId) {
        return ResponseEntity.ok(payoutService.getPayoutsByProviderId(providerId));
    }
}
