package com.PaymentService.Payment.controller;

import com.PaymentService.Payment.dto.ChargeRequest;
import com.PaymentService.Payment.dto.PaymentResponse;
import com.PaymentService.Payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payment Management", description = "Endpoints for booking payment processing and receipts")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/charge")
    @Operation(summary = "Process automatic or manual payment for a completed booking (U-10)")
    public ResponseEntity<PaymentResponse> processCharge(
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @Valid @RequestBody ChargeRequest request) {

        Long effectiveUserId = headerUserId != null ? headerUserId : 1L;
        PaymentResponse response = paymentService.processCharge(effectiveUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{paymentId}")
    @Operation(summary = "View payment details and receipt by payment ID (U-11)")
    public ResponseEntity<PaymentResponse> getPaymentById(@PathVariable Long paymentId) {
        return ResponseEntity.ok(paymentService.getPaymentById(paymentId));
    }

    @GetMapping("/booking/{bookingId}")
    @Operation(summary = "View payment details associated with a booking ID")
    public ResponseEntity<PaymentResponse> getPaymentByBookingId(@PathVariable Long bookingId) {
        return ResponseEntity.ok(paymentService.getPaymentByBookingId(bookingId));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get payment history and receipts for a specific user (U-11)")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(paymentService.getPaymentsByUserId(userId));
    }

    @GetMapping("/provider/{providerId}")
    @Operation(summary = "Get received payments history for a provider")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByProviderId(@PathVariable Long providerId) {
        return ResponseEntity.ok(paymentService.getPaymentsByProviderId(providerId));
    }
}
