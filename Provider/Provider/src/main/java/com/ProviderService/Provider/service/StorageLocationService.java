package com.ProviderService.Provider.service;

import com.ProviderService.Provider.dto.StorageLocationRequest;
import com.ProviderService.Provider.dto.StorageLocationResponse;

import java.util.List;

/**
 * Service contract for managing provider storage locations (P-3).
 */
public interface StorageLocationService {

    StorageLocationResponse addLocation(Long providerId, StorageLocationRequest request);

    List<StorageLocationResponse> getLocationsByProviderId(Long providerId);

    StorageLocationResponse getLocationById(Long locationId);

    StorageLocationResponse updateLocation(Long locationId, StorageLocationRequest request);

    void setLocationAvailability(Long locationId, boolean available);

    void deleteLocation(Long locationId);

    List<StorageLocationResponse> getAllAvailableLocations();
}
