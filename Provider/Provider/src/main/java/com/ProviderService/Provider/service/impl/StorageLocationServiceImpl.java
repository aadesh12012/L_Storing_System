package com.ProviderService.Provider.service.impl;

import com.ProviderService.Provider.dto.StorageLocationRequest;
import com.ProviderService.Provider.dto.StorageLocationResponse;
import com.ProviderService.Provider.model.StorageLocation;
import com.ProviderService.Provider.repository.ProviderRepository;
import com.ProviderService.Provider.repository.StorageLocationRepository;
import com.ProviderService.Provider.service.StorageLocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implementation of {@link StorageLocationService}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class StorageLocationServiceImpl implements StorageLocationService {

    private final StorageLocationRepository storageLocationRepository;
    private final ProviderRepository providerRepository;

    @Override
    public StorageLocationResponse addLocation(Long providerId, StorageLocationRequest request) {
        if (!providerRepository.existsById(providerId)) {
            throw new IllegalArgumentException("Provider not found with ID: " + providerId);
        }

        StorageLocation location = StorageLocation.builder()
                .providerId(providerId)
                .address(request.getAddress())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .operatingHoursOpen(request.getOperatingHoursOpen())
                .operatingHoursClose(request.getOperatingHoursClose())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true)
                .build();

        StorageLocation saved = storageLocationRepository.save(location);
        log.info("Storage location added: id={}, providerId={}", saved.getId(), providerId);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StorageLocationResponse> getLocationsByProviderId(Long providerId) {
        if (!providerRepository.existsById(providerId)) {
            throw new IllegalArgumentException("Provider not found with ID: " + providerId);
        }
        return storageLocationRepository.findByProviderId(providerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public StorageLocationResponse getLocationById(Long locationId) {
        StorageLocation location = findOrThrow(locationId);
        return toResponse(location);
    }

    @Override
    public StorageLocationResponse updateLocation(Long locationId, StorageLocationRequest request) {
        StorageLocation location = findOrThrow(locationId);
        location.setAddress(request.getAddress());
        location.setLatitude(request.getLatitude());
        location.setLongitude(request.getLongitude());
        location.setOperatingHoursOpen(request.getOperatingHoursOpen());
        location.setOperatingHoursClose(request.getOperatingHoursClose());
        if (request.getIsAvailable() != null) {
            location.setIsAvailable(request.getIsAvailable());
        }

        StorageLocation updated = storageLocationRepository.save(location);
        log.info("Storage location updated: id={}", updated.getId());
        return toResponse(updated);
    }

    @Override
    public void setLocationAvailability(Long locationId, boolean available) {
        StorageLocation location = findOrThrow(locationId);
        location.setIsAvailable(available);
        storageLocationRepository.save(location);
        log.info("Storage location {} availability set to {}", locationId, available);
    }

    @Override
    public void deleteLocation(Long locationId) {
        StorageLocation location = findOrThrow(locationId);
        storageLocationRepository.delete(location);
        log.info("Storage location deleted: id={}", locationId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StorageLocationResponse> getAllAvailableLocations() {
        return storageLocationRepository.findByIsAvailableTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private StorageLocation findOrThrow(Long id) {
        return storageLocationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Storage location not found with ID: " + id));
    }

    private StorageLocationResponse toResponse(StorageLocation location) {
        return StorageLocationResponse.builder()
                .id(location.getId())
                .providerId(location.getProviderId())
                .address(location.getAddress())
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .operatingHoursOpen(location.getOperatingHoursOpen())
                .operatingHoursClose(location.getOperatingHoursClose())
                .isAvailable(location.getIsAvailable())
                .build();
    }
}
