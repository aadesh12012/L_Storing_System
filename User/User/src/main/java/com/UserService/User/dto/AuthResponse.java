package com.UserService.User.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Response DTO returned after successful login, carrying the JWT access token.
 */
@Data
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String tokenType = "Bearer";
    private long expiresInMs;

    public AuthResponse(String accessToken, long expiresInMs) {
        this.accessToken = accessToken;
        this.expiresInMs = expiresInMs;
    }
}
