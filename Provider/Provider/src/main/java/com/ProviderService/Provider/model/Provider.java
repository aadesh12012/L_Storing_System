package com.ProviderService.Provider.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * JPA entity representing a storage provider.
 * A provider account is linked to a platform User and requires
 * admin approval (KYC) before going live (P-1, P-2).
 */
@Entity
@Table(name = "providers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Provider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Foreign key reference to user-service user ID (no cross-DB join). */
    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "business_name", nullable = false, length = 200)
    private String businessName;

    @Enumerated(EnumType.STRING)
    @Column(name = "kyc_status", nullable = false, length = 20)
    @Builder.Default
    private KycStatus kycStatus = KycStatus.PENDING;

    /**
     * Hourly storage rate set by the provider (P-4).
     * Must stay within platform-defined min/max guardrails (A-6).
     */
    @Column(name = "hourly_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    /** Maximum number of bags the provider can hold simultaneously (P-11). */
    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    /** Current number of bags in storage (updated on booking state changes). */
    @Column(name = "current_load", nullable = false)
    @Builder.Default
    private Integer currentLoad = 0;

    /** Average rating computed from reviews (U-12, P-12). */
    @Column(name = "rating_avg", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal ratingAvg = BigDecimal.ZERO;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum KycStatus {
        PENDING, APPROVED, REJECTED
    }
}
