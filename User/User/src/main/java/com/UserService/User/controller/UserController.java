package com.UserService.User.controller;

import com.UserService.User.dto.*;
import com.UserService.User.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller exposing authentication and user profile endpoints.
 *
 * <pre>
 *  POST /api/v1/auth/register  → register new account      (U-1)
 *  POST /api/v1/auth/login     → login, returns JWT         (U-1)
 *  GET  /api/v1/users/{id}     → fetch own profile          (U-2)
 *  PUT  /api/v1/users/{id}     → update own profile         (U-2)
 * </pre>
 */
@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ── Auth ─────────────────────────────────────────────────────────

    @PostMapping("/api/v1/auth/register")
    public ResponseEntity<UserProfileResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.register(request));
    }

    @PostMapping("/api/v1/auth/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    // ── Profile ──────────────────────────────────────────────────────

    @GetMapping("/api/v1/users/{id}")
    public ResponseEntity<UserProfileResponse> getProfile(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getProfile(id));
    }

    @PutMapping("/api/v1/users/{id}")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @PathVariable Long id,
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(userService.updateProfile(id, request));
    }

    // ── Admin ─────────────────────────────────────────────────────────

    /** List all users – admin only (A-2). GET /api/v1/users */
    @GetMapping("/api/v1/users")
    public ResponseEntity<List<UserProfileResponse>> listAllUsers() {
        return ResponseEntity.ok(userService.listAllUsers());
    }

    @PatchMapping("/api/v1/users/{id}/status")
    public ResponseEntity<Void> setStatus(
            @PathVariable Long id,
            @RequestParam boolean active) {
        userService.setActiveStatus(id, active);
        return ResponseEntity.noContent().build();
    }
}
