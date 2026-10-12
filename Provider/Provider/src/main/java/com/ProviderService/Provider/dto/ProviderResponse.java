package com.ProviderService.Provider.dto;

import com.ProviderService.Provider.model.Provider;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Read-only view of a Provider returned to API consumers.
 */
@Data
public class ProviderResponse {

    private Long id;
    private Long userId;
    private String businessName;
    private Provider.KycStatus kycStatus;
    private BigDecimal hourlyRate;
    private Integer capacity;
    private Integer currentLoad;
    private BigDecimal ratingAvg;
    private Boolean isActive;
}
