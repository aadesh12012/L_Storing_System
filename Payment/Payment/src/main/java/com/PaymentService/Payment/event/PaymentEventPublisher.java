package com.PaymentService.Payment.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class PaymentEventPublisher {

    public static final String TOPIC_PAYMENT_COMPLETED = "payment-completed-events";
    public static final String TOPIC_PAYMENT_REFUNDED = "payment-refunded-events";

    private final org.springframework.kafka.core.KafkaTemplate<String, Object> kafkaTemplate;

    public PaymentEventPublisher(
            @org.springframework.beans.factory.annotation.Autowired(required = false)
            org.springframework.kafka.core.KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishPaymentCompleted(PaymentCompletedEvent event) {
        if (kafkaTemplate == null) {
            log.info("KafkaTemplate not configured; skipping publish for bookingId={}", event.getBookingId());
            return;
        }
        try {
            log.info("Publishing PaymentCompletedEvent: paymentId={}, bookingId={}",
                    event.getPaymentId(), event.getBookingId());
            kafkaTemplate.send(TOPIC_PAYMENT_COMPLETED, String.valueOf(event.getBookingId()), event);
        } catch (Exception ex) {
            log.error("Failed to publish PaymentCompletedEvent for booking {}: {}",
                    event.getBookingId(), ex.getMessage());
        }
    }

    public void publishPaymentRefunded(PaymentRefundedEvent event) {
        if (kafkaTemplate == null) {
            log.info("KafkaTemplate not configured; skipping publish for bookingId={}", event.getBookingId());
            return;
        }
        try {
            log.info("Publishing PaymentRefundedEvent: refundId={}, bookingId={}",
                    event.getRefundId(), event.getBookingId());
            kafkaTemplate.send(TOPIC_PAYMENT_REFUNDED, String.valueOf(event.getBookingId()), event);
        } catch (Exception ex) {
            log.error("Failed to publish PaymentRefundedEvent for booking {}: {}",
                    event.getBookingId(), ex.getMessage());
        }
    }
}
