package com.PaymentService.Payment.repository;

import com.PaymentService.Payment.model.Payout;
import com.PaymentService.Payment.model.PayoutStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PayoutRepository extends JpaRepository<Payout, Long> {

    List<Payout> findByProviderIdOrderByCreatedAtDesc(Long providerId);

    List<Payout> findByStatus(PayoutStatus status);

    @Query("SELECT COALESCE(SUM(p.amount), 0.00) FROM Payout p WHERE p.providerId = :providerId AND p.status = :status")
    BigDecimal sumPayoutsByProviderIdAndStatus(
            @Param("providerId") Long providerId,
            @Param("status") PayoutStatus status
    );
}
