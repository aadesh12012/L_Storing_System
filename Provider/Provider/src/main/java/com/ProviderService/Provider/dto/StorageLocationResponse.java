package com.ProviderService.Provider.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/**
 * Response DTO representing a physical storage location.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StorageLocationResponse {

    private Long id;
    private Long providerId;
    private String address;
    private Double latitude;
    private Double longitude;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime operatingHoursOpen;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime operatingHoursClose;

    private Boolean isAvailable;
}
