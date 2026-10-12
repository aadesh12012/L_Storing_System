package com.ProviderService.Provider.controller;

import com.ProviderService.Provider.dto.StorageLocationRequest;
import com.ProviderService.Provider.dto.StorageLocationResponse;
import com.ProviderService.Provider.service.StorageLocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for managing provider storage locations (P-3).
 *
 * <pre>
 *  POST   /api/v1/providers/{providerId}/locations      → add storage location
 *  GET    /api/v1/providers/{providerId}/locations      → list provider's locations
 *  GET    /api/v1/providers/locations/{locationId}      → get location by ID
 *  GET    /api/v1/providers/locations                   → list all available locations
 *  PUT    /api/v1/providers/locations/{locationId}      → update location
 *  PATCH  /api/v1/providers/locations/{locationId}/status → update availability
 *  DELETE /api/v1/providers/locations/{locationId}      → delete location
 * </pre>
 */
@RestController
@RequestMapping("/api/v1/providers")
@RequiredArgsConstructor
public class StorageLocationController {

    private final StorageLocationService storageLocationService;

    @PostMapping("/{providerId}/locations")
    public ResponseEntity<StorageLocationResponse> addLocation(
            @PathVariable Long providerId,
            @Valid @RequestBody StorageLocationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(storageLocationService.addLocation(providerId, request));
    }

    @GetMapping("/{providerId}/locations")
    public ResponseEntity<List<StorageLocationResponse>> getLocationsByProviderId(
            @PathVariable Long providerId) {
        return ResponseEntity.ok(storageLocationService.getLocationsByProviderId(providerId));
    }

    @GetMapping("/locations/{locationId}")
    public ResponseEntity<StorageLocationResponse> getLocationById(
            @PathVariable Long locationId) {
        return ResponseEntity.ok(storageLocationService.getLocationById(locationId));
    }

    @GetMapping("/locations")
    public ResponseEntity<List<StorageLocationResponse>> getAllAvailableLocations() {
        return ResponseEntity.ok(storageLocationService.getAllAvailableLocations());
    }

    @PutMapping("/locations/{locationId}")
    public ResponseEntity<StorageLocationResponse> updateLocation(
            @PathVariable Long locationId,
            @Valid @RequestBody StorageLocationRequest request) {
        return ResponseEntity.ok(storageLocationService.updateLocation(locationId, request));
    }

    @PatchMapping("/locations/{locationId}/status")
    public ResponseEntity<Void> setAvailability(
            @PathVariable Long locationId,
            @RequestParam boolean available) {
        storageLocationService.setLocationAvailability(locationId, available);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/locations/{locationId}")
    public ResponseEntity<Void> deleteLocation(@PathVariable Long locationId) {
        storageLocationService.deleteLocation(locationId);
        return ResponseEntity.noContent().build();
    }
}
