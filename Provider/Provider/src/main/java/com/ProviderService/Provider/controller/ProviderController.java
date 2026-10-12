package com.ProviderService.Provider.controller;

import com.ProviderService.Provider.dto.ProviderRequest;
import com.ProviderService.Provider.dto.ProviderResponse;
import com.ProviderService.Provider.model.Provider;
import com.ProviderService.Provider.service.ProviderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for provider management endpoints.
 *
 * <pre>
 *  POST   /api/v1/providers               → register provider       (P-1)
 *  GET    /api/v1/providers/{id}          → get provider details    (U-5)
 *  GET    /api/v1/providers/user/{userId} → get by user id
 *  PUT    /api/v1/providers/{id}          → update listing          (P-3,P-4)
 *  PATCH  /api/v1/providers/{id}/kyc     → admin KYC decision      (A-1)
 *  GET    /api/v1/providers/kyc/pending  → list pending KYC        (A-1)
 *  PATCH  /api/v1/providers/{id}/status  → suspend/activate         (A-2,P-11)
 * </pre>
 */
@RestController
@RequestMapping("/api/v1/providers")
@RequiredArgsConstructor
public class ProviderController {

    private final ProviderService providerService;

    @PostMapping
    public ResponseEntity<ProviderResponse> register(
            @RequestParam Long userId,
            @Valid @RequestBody ProviderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(providerService.register(userId, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProviderResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(providerService.getById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ProviderResponse> getByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(providerService.getByUserId(userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProviderResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ProviderRequest request) {
        return ResponseEntity.ok(providerService.update(id, request));
    }

    @PatchMapping("/{id}/kyc")
    public ResponseEntity<ProviderResponse> updateKyc(
            @PathVariable Long id,
            @RequestParam Provider.KycStatus status) {
        return ResponseEntity.ok(providerService.updateKycStatus(id, status));
    }

    @GetMapping("/kyc/pending")
    public ResponseEntity<List<ProviderResponse>> listPendingKyc() {
        return ResponseEntity.ok(providerService.listPendingKyc());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> setStatus(
            @PathVariable Long id,
            @RequestParam boolean active) {
        providerService.setActiveStatus(id, active);
        return ResponseEntity.noContent().build();
    }
}
