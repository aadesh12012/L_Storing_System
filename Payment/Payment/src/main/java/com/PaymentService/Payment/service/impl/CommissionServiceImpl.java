package com.PaymentService.Payment.service.impl;

import com.PaymentService.Payment.dto.CommissionConfigRequest;
import com.PaymentService.Payment.dto.CommissionConfigResponse;
import com.PaymentService.Payment.model.CommissionConfig;
import com.PaymentService.Payment.repository.CommissionConfigRepository;
import com.PaymentService.Payment.service.CommissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommissionServiceImpl implements CommissionService {

    private final CommissionConfigRepository commissionConfigRepository;

    @Value("${app.payment.default-commission-rate:0.15}")
    private BigDecimal defaultCommissionRate;

    @Override
    @Transactional(readOnly = true)
    public CommissionConfigResponse getCurrentCommissionConfig() {
        CommissionConfig config = commissionConfigRepository.findTopByOrderByIdDesc()
                .orElseGet(this::createDefaultConfig);

        return toResponse(config);
    }

    @Override
    @Transactional
    public CommissionConfigResponse updateCommissionConfig(Long adminId, CommissionConfigRequest request) {
        CommissionConfig config = CommissionConfig.builder()
                .commissionRate(request.getCommissionRate())
                .minHourlyRate(request.getMinHourlyRate() != null ? request.getMinHourlyRate() : BigDecimal.valueOf(1.00))
                .maxHourlyRate(request.getMaxHourlyRate() != null ? request.getMaxHourlyRate() : BigDecimal.valueOf(100.00))
                .updatedByAdminId(adminId)
                .updatedAt(LocalDateTime.now())
                .build();

        CommissionConfig saved = commissionConfigRepository.save(config);
        log.info("Platform commission updated by admin {}: rate={}", adminId, request.getCommissionRate());
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getEffectiveCommissionRate() {
        return commissionConfigRepository.findTopByOrderByIdDesc()
                .map(CommissionConfig::getCommissionRate)
                .orElse(defaultCommissionRate);
    }

    private CommissionConfig createDefaultConfig() {
        CommissionConfig config = CommissionConfig.builder()
                .commissionRate(defaultCommissionRate)
                .minHourlyRate(BigDecimal.valueOf(1.00))
                .maxHourlyRate(BigDecimal.valueOf(100.00))
                .updatedByAdminId(1L)
                .updatedAt(LocalDateTime.now())
                .build();
        return commissionConfigRepository.save(config);
    }

    private CommissionConfigResponse toResponse(CommissionConfig config) {
        BigDecimal percentage = config.getCommissionRate().multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
        return CommissionConfigResponse.builder()
                .id(config.getId())
                .commissionRate(config.getCommissionRate())
                .commissionPercentage(percentage + "%")
                .minHourlyRate(config.getMinHourlyRate())
                .maxHourlyRate(config.getMaxHourlyRate())
                .updatedByAdminId(config.getUpdatedByAdminId())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
