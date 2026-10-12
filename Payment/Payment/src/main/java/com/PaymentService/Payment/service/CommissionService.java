package com.PaymentService.Payment.service;

import com.PaymentService.Payment.dto.CommissionConfigRequest;
import com.PaymentService.Payment.dto.CommissionConfigResponse;

import java.math.BigDecimal;

public interface CommissionService {

    CommissionConfigResponse getCurrentCommissionConfig();

    CommissionConfigResponse updateCommissionConfig(Long adminId, CommissionConfigRequest request);

    BigDecimal getEffectiveCommissionRate();
}
