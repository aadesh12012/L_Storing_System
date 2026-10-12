package com.BookingService.Booking.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

/**
 * Entity representing an individual luggage item in a booking request.
 */
@Entity
@Table(name = "luggage_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LuggageItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    @JsonBackReference
    private Booking booking;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LuggageSize size;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LuggageType type;

    @Column(length = 255)
    private String description;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    public enum LuggageSize {
        SMALL, MEDIUM, LARGE, OVERSIZED
    }

    public enum LuggageType {
        SUITCASE, BACKPACK, DUFFEL, BOX, OTHER
    }
}
