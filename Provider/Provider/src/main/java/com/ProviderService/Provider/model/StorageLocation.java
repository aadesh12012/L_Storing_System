package com.ProviderService.Provider.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

/**
 * JPA entity for a physical storage location owned by a provider.
 * One provider may have multiple locations (P-3).
 */
@Entity
@Table(name = "storage_locations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorageLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "provider_id", nullable = false)
    private Long providerId;

    @Column(nullable = false, length = 300)
    private String address;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "operating_hours_open")
    private LocalTime operatingHoursOpen;

    @Column(name = "operating_hours_close")
    private LocalTime operatingHoursClose;

    @Column(name = "is_available", nullable = false)
    @Builder.Default
    private Boolean isAvailable = true;
}
