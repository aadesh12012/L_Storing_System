package com.BookingService.Booking.dto;

import com.BookingService.Booking.model.LuggageItem;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for luggage item in request/response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LuggageItemDto {

    private Long id;

    @NotNull(message = "Luggage size is required")
    private LuggageItem.LuggageSize size;

    @NotNull(message = "Luggage type is required")
    private LuggageItem.LuggageType type;

    @Size(max = 255)
    private String description;

    @Size(max = 500)
    private String photoUrl;
}
