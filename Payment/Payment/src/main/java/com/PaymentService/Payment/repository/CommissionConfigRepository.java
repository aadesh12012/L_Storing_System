package com.PaymentService.Payment.repository;

import com.PaymentService.Payment.model.CommissionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CommissionConfigRepository extends JpaRepository<CommissionConfig, Long> {

    Optional<CommissionConfig> findTopByOrderByIdDesc();
}
