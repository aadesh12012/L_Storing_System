package com.Api_gateway.ApiGateWay.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * Utility class for JWT parsing and validation at the gateway level.
 * Decodes the token, verifies the signature against the shared secret,
 * and extracts claims (subject, role, email) to be forwarded as HTTP headers
 * to downstream services.
 */
@Component
@Slf4j
public class JwtUtil {

    private final SecretKey signingKey;

    public JwtUtil(@Value("${app.jwt.secret}") String jwtSecret) {
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Validates the given JWT string.
     *
     * @param token raw JWT (without "Bearer " prefix)
     * @return true if valid and not expired
     */
    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT at gateway: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Extracts the subject (user ID) from a valid token.
     *
     * @param token raw JWT
     * @return subject claim value
     */
    public String extractSubject(String token) {
        return parseClaims(token).getSubject();
    }

    /**
     * Extracts the role claim from a valid token.
     *
     * @param token raw JWT
     * @return role claim value (e.g. "USER", "PROVIDER", "ADMIN")
     */
    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    /**
     * Extracts the email claim from a valid token.
     *
     * @param token raw JWT
     * @return email claim value
     */
    public String extractEmail(String token) {
        return parseClaims(token).get("email", String.class);
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}

