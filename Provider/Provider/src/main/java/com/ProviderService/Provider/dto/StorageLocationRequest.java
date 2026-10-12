package com.ProviderService.Provider.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalTime;

/**
 * Request DTO for creating or updating a storage location (P-3).
 */
@Data
public class StorageLocationRequest {

    @NotBlank(message = "Address is required")
    @Size(max = 300)
    private String address;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    private Double longitude;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime operatingHoursOpen;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime operatingHoursClose;

    private Boolean isAvailable = true;
}
