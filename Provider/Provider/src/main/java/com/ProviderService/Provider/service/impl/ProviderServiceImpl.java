package com.ProviderService.Provider.service.impl;

import com.ProviderService.Provider.dto.ProviderRequest;
import com.ProviderService.Provider.dto.ProviderResponse;
import com.ProviderService.Provider.model.Provider;
import com.ProviderService.Provider.repository.ProviderRepository;
import com.ProviderService.Provider.service.ProviderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

/**
 * Default implementation of {@link ProviderService}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProviderServiceImpl implements ProviderService {

    private final ProviderRepository providerRepository;

    @Override
    public ProviderResponse register(Long userId, ProviderRequest request) {
        if (providerRepository.existsByUserId(userId)) {
            throw new IllegalArgumentException("Provider already exists for userId: " + userId);
        }
        Provider provider = Provider.builder()
                .userId(userId)
                .businessName(request.getBusinessName())
                .hourlyRate(request.getHourlyRate())
                .capacity(request.getCapacity())
                .kycStatus(Provider.KycStatus.PENDING)
                .build();
        Provider saved = providerRepository.save(provider);
        log.info("Provider registered: id={}, userId={}", saved.getId(), userId);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ProviderResponse getById(Long providerId) {
        return toResponse(findOrThrow(providerId));
    }

    @Override
    @Transactional(readOnly = true)
    public ProviderResponse getByUserId(Long userId) {
        Provider p = providerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No provider for userId: " + userId));
        return toResponse(p);
    }

    @Override
    public ProviderResponse update(Long providerId, ProviderRequest request) {
        Provider p = findOrThrow(providerId);
        p.setBusinessName(request.getBusinessName());
        p.setHourlyRate(request.getHourlyRate());
        p.setCapacity(request.getCapacity());
        return toResponse(providerRepository.save(p));
    }

    @Override
    public ProviderResponse updateKycStatus(Long providerId, Provider.KycStatus status) {
        Provider p = findOrThrow(providerId);
        p.setKycStatus(status);
        if (status == Provider.KycStatus.APPROVED) {
            p.setIsActive(true);
        }
        log.info("Provider {} KYC status updated to {}", providerId, status);
        return toResponse(providerRepository.save(p));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProviderResponse> listPendingKyc() {
        return providerRepository.findByKycStatus(Provider.KycStatus.PENDING)
                .stream().map(this::toResponse).toList();
    }

    @Override
    public void setActiveStatus(Long providerId, boolean active) {
        Provider p = findOrThrow(providerId);
        p.setIsActive(active);
        providerRepository.save(p);
        log.info("Provider {} active={}", providerId, active);
    }

    // ── helpers ──────────────────────────────────────────────────────
    private Provider findOrThrow(Long id) {
        return providerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Provider not found: " + id));
    }

    private ProviderResponse toResponse(Provider p) {
        ProviderResponse dto = new ProviderResponse();
        dto.setId(p.getId());
        dto.setUserId(p.getUserId());
        dto.setBusinessName(p.getBusinessName());
        dto.setKycStatus(p.getKycStatus());
        dto.setHourlyRate(p.getHourlyRate());
        dto.setCapacity(p.getCapacity());
        dto.setCurrentLoad(p.getCurrentLoad());
        dto.setRatingAvg(p.getRatingAvg() != null ? p.getRatingAvg() : BigDecimal.ZERO);
        dto.setIsActive(p.getIsActive());
        return dto;
    }
}
