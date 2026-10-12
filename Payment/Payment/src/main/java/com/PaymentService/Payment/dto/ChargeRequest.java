package com.PaymentService.Payment.dto;

import com.PaymentService.Payment.model.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChargeRequest {

    @NotNull(message = "bookingId is required")
    private Long bookingId;

    @NotNull(message = "providerId is required")
    private Long providerId;

    @NotNull(message = "amount is required")
    @DecimalMin(value = "0.01", message = "amount must be greater than zero")
    private BigDecimal amount;

    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.CREDIT_CARD;

    private String paymentToken; // e.g., "tok_visa", Stripe token, or mock payment token
}
