package com.ProviderService.Provider.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Request DTO for registering or updating a provider profile (P-1, P-3, P-4).
 */
@Data
public class ProviderRequest {

    @NotBlank(message = "Business name is required")
    @Size(max = 200)
    private String businessName;

    @NotNull(message = "Hourly rate is required")
    @DecimalMin(value = "0.01", message = "Hourly rate must be positive")
    private BigDecimal hourlyRate;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;
}
