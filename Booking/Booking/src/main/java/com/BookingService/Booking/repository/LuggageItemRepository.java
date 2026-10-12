package com.BookingService.Booking.repository;

import com.BookingService.Booking.model.LuggageItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for LuggageItem entities.
 */
@Repository
public interface LuggageItemRepository extends JpaRepository<LuggageItem, Long> {

    List<LuggageItem> findByBookingId(Long bookingId);
}
