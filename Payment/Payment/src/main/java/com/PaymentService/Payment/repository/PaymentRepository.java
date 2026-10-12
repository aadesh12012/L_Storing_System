package com.PaymentService.Payment.repository;

import com.PaymentService.Payment.model.Payment;
import com.PaymentService.Payment.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByBookingId(Long bookingId);

    List<Payment> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Payment> findByProviderIdOrderByCreatedAtDesc(Long providerId);

    List<Payment> findByStatus(PaymentStatus status);

    List<Payment> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(p.providerEarnings), 0.00) FROM Payment p WHERE p.providerId = :providerId AND p.status = :status")
    BigDecimal sumProviderEarningsByProviderIdAndStatus(
            @Param("providerId") Long providerId,
            @Param("status") PaymentStatus status
    );

    @Query("SELECT COALESCE(SUM(p.amount), 0.00) FROM Payment p WHERE p.status = :status")
    BigDecimal sumTotalGmvByStatus(@Param("status") PaymentStatus status);

    @Query("SELECT COALESCE(SUM(p.commissionAmount), 0.00) FROM Payment p WHERE p.status = :status")
    BigDecimal sumTotalCommissionByStatus(@Param("status") PaymentStatus status);
}
