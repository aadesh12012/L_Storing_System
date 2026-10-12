package com.PaymentService.Payment.service;

import com.PaymentService.Payment.dto.ChargeRequest;
import com.PaymentService.Payment.dto.PaymentResponse;
import com.PaymentService.Payment.dto.RefundRequest;
import com.PaymentService.Payment.dto.RefundResponse;
import com.PaymentService.Payment.event.PaymentEventPublisher;
import com.PaymentService.Payment.gateway.PaymentGatewayService;
import com.PaymentService.Payment.model.Payment;
import com.PaymentService.Payment.model.PaymentMethod;
import com.PaymentService.Payment.model.PaymentStatus;
import com.PaymentService.Payment.repository.PaymentRepository;
import com.PaymentService.Payment.repository.PayoutRepository;
import com.PaymentService.Payment.repository.RefundRepository;
import com.PaymentService.Payment.service.impl.PaymentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PayoutRepository payoutRepository;

    @Mock
    private RefundRepository refundRepository;

    @Mock
    private CommissionService commissionService;

    @Mock
    private PaymentGatewayService gatewayService;

    @Mock
    private PaymentEventPublisher eventPublisher;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testProcessCharge_Success() {
        Long userId = 10L;
        Long bookingId = 100L;
        Long providerId = 20L;
        BigDecimal amount = new BigDecimal("50.00");

        ChargeRequest request = ChargeRequest.builder()
                .bookingId(bookingId)
                .providerId(providerId)
                .amount(amount)
                .paymentMethod(PaymentMethod.CREDIT_CARD)
                .paymentToken("tok_visa")
                .build();

        when(paymentRepository.findByBookingId(bookingId)).thenReturn(Optional.empty());
        when(commissionService.getEffectiveCommissionRate()).thenReturn(new BigDecimal("0.1500"));

        when(gatewayService.processCharge(eq(amount), eq("USD"), eq("tok_visa"), eq(bookingId)))
                .thenReturn(PaymentGatewayService.ChargeResult.builder()
                        .successful(true)
                        .transactionId("ch_test_123456")
                        .build());

        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment p = invocation.getArgument(0);
            p.setId(1L);
            return p;
        });

        PaymentResponse response = paymentService.processCharge(userId, request);

        assertNotNull(response);
        assertEquals(PaymentStatus.SUCCESS, response.getStatus());
        assertEquals("ch_test_123456", response.getGatewayTxnId());
        assertEquals(new BigDecimal("7.50"), response.getCommissionAmount()); // 50 * 0.15
        assertEquals(new BigDecimal("42.50"), response.getProviderEarnings()); // 50 - 7.50

        verify(eventPublisher, times(1)).publishPaymentCompleted(any());
    }

    @Test
    void testProcessCharge_AlreadyPaid_ThrowsException() {
        Long bookingId = 101L;
        ChargeRequest request = ChargeRequest.builder()
                .bookingId(bookingId)
                .providerId(20L)
                .amount(new BigDecimal("30.00"))
                .build();

        Payment existing = Payment.builder()
                .id(1L)
                .bookingId(bookingId)
                .status(PaymentStatus.SUCCESS)
                .build();

        when(paymentRepository.findByBookingId(bookingId)).thenReturn(Optional.of(existing));

        assertThrows(IllegalStateException.class, () -> paymentService.processCharge(10L, request));
    }

    @Test
    void testRefundPayment_Success() {
        Long paymentId = 1L;
        Long adminId = 99L;

        Payment payment = Payment.builder()
                .id(paymentId)
                .bookingId(100L)
                .amount(new BigDecimal("50.00"))
                .refundedAmount(BigDecimal.ZERO)
                .status(PaymentStatus.SUCCESS)
                .gatewayTxnId("ch_123")
                .build();

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(gatewayService.processRefund(eq("ch_123"), any(), any()))
                .thenReturn(PaymentGatewayService.RefundResult.builder()
                        .successful(true)
                        .refundTransactionId("re_123")
                        .build());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(refundRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        RefundRequest request = RefundRequest.builder()
                .amount(new BigDecimal("50.00"))
                .reason("Luggage damaged during storage")
                .build();

        RefundResponse response = paymentService.refundPayment(paymentId, adminId, request);

        assertNotNull(response);
        assertEquals(new BigDecimal("50.00"), response.getAmount());
        assertEquals("re_123", response.getGatewayRefundId());
        assertEquals(PaymentStatus.REFUNDED, payment.getStatus());
        verify(eventPublisher, times(1)).publishPaymentRefunded(any());
    }
}
