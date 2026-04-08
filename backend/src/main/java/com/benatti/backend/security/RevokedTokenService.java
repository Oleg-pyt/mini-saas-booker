package com.benatti.backend.security;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RevokedTokenService {
    private final Map<String, Instant> revokedTokens = new ConcurrentHashMap<>();

    public void revoke(String token, Instant expiresAt) {
        revokedTokens.put(token, expiresAt);
        cleanupExpired();
    }

    public boolean isRevoked(String token) {
        cleanupExpired();
        return revokedTokens.containsKey(token);
    }

    private void cleanupExpired() {
        Instant now = Instant.now();
        revokedTokens.entrySet().removeIf(entry -> entry.getValue().isBefore(now));
    }
}
