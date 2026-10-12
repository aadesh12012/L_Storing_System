package com.ProviderService.Provider.repository;

import com.ProviderService.Provider.model.Provider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Provider entities.
 */
@Repository
public interface ProviderRepository extends JpaRepository<Provider, Long> {

    Optional<Provider> findByUserId(Long userId);

    List<Provider> findByKycStatus(Provider.KycStatus kycStatus);

    boolean existsByUserId(Long userId);
}
