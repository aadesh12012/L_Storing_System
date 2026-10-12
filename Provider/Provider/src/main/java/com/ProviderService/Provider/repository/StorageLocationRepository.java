package com.ProviderService.Provider.repository;

import com.ProviderService.Provider.model.StorageLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for StorageLocation entities.
 */
@Repository
public interface StorageLocationRepository extends JpaRepository<StorageLocation, Long> {

    List<StorageLocation> findByProviderId(Long providerId);

    List<StorageLocation> findByIsAvailableTrue();
}
