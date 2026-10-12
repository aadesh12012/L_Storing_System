package com.ProviderService.Provider.service;

import com.ProviderService.Provider.dto.ProviderRequest;
import com.ProviderService.Provider.dto.ProviderResponse;
import com.ProviderService.Provider.model.Provider;

import java.util.List;

/**
 * Contract for provider lifecycle operations.
 */
public interface ProviderService {

    /** Register a new provider (P-1). Returns pending-approval profile. */
    ProviderResponse register(Long userId, ProviderRequest request);

    /** Fetch provider profile by its own ID. */
    ProviderResponse getById(Long providerId);

    /** Fetch provider profile by the linked user ID. */
    ProviderResponse getByUserId(Long userId);

    /** Update provider's own listing details (P-3, P-4). */
    ProviderResponse update(Long providerId, ProviderRequest request);

    /** Admin: approve or reject KYC (A-1). */
    ProviderResponse updateKycStatus(Long providerId, Provider.KycStatus status);

    /** Admin: list all providers pending KYC review (A-1). */
    List<ProviderResponse> listPendingKyc();

    /** Toggle provider's active status — admin ban or provider going unavailable (A-2, P-11). */
    void setActiveStatus(Long providerId, boolean active);
}
