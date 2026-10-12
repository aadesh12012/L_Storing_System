package com.PaymentService.Payment.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "commission_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommissionConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "commission_rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal commissionRate; // e.g., 0.1500 for 15%

    @Column(name = "min_hourly_rate", precision = 10, scale = 2)
    private BigDecimal minHourlyRate;

    @Column(name = "max_hourly_rate", precision = 10, scale = 2)
    private BigDecimal maxHourlyRate;

    @Column(name = "updated_by_admin_id")
    private Long updatedByAdminId;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
