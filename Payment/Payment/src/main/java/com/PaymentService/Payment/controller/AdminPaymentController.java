package com.PaymentService.Payment.controller;

import com.PaymentService.Payment.dto.*;
import com.PaymentService.Payment.service.CommissionService;
import com.PaymentService.Payment.service.PaymentService;
import com.PaymentService.Payment.service.PayoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payments/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Payment & Commission Management", description = "Endpoints for platform commissions, refunds, dispute interventions, and GMV stats (A-4, A-5, A-8)")
public class AdminPaymentController {

    private final PaymentService paymentService;
    private final PayoutService payoutService;
    private final CommissionService commissionService;

    @PostMapping("/{paymentId}/refund")
    @Operation(summary = "Admin force cancel or refund payment for customer disputes (A-4)")
    public ResponseEntity<RefundResponse> refundPayment(
            @PathVariable Long paymentId,
            @RequestHeader(value = "X-User-Id", required = false) Long headerAdminId,
            @Valid @RequestBody RefundRequest request) {

        Long effectiveAdminId = headerAdminId != null ? headerAdminId : 1L;
        return ResponseEntity.ok(paymentService.refundPayment(paymentId, effectiveAdminId, request));
    }

    @GetMapping("/commission")
    @Operation(summary = "Admin view platform commission rate and pricing guardrails (A-5, A-6)")
    public ResponseEntity<CommissionConfigResponse> getCommissionConfig() {
        return ResponseEntity.ok(commissionService.getCurrentCommissionConfig());
    }

    @PutMapping("/commission")
    @Operation(summary = "Admin set platform commission percentage (A-5)")
    public ResponseEntity<CommissionConfigResponse> updateCommissionConfig(
            @RequestHeader(value = "X-User-Id", required = false) Long headerAdminId,
            @Valid @RequestBody CommissionConfigRequest request) {

        Long effectiveAdminId = headerAdminId != null ? headerAdminId : 1L;
        return ResponseEntity.ok(commissionService.updateCommissionConfig(effectiveAdminId, request));
    }

    @GetMapping("/stats")
    @Operation(summary = "Admin view overall GMV, platform commission, and payout analytics (A-8)")
    public ResponseEntity<AdminTransactionStatsResponse> getPlatformStats() {
        return ResponseEntity.ok(paymentService.getPlatformStats());
    }

    @GetMapping("/all")
    @Operation(summary = "Admin view all transactions across platform (A-3)")
    public ResponseEntity<List<PaymentResponse>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @GetMapping("/payouts")
    @Operation(summary = "Admin view all payouts across platform (A-3)")
    public ResponseEntity<List<PayoutResponse>> getAllPayouts() {
        return ResponseEntity.ok(payoutService.getAllPayouts());
    }
}
