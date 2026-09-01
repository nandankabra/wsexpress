package com.shiptrack.auth.dto;

import java.util.Set;

public record AuthResponse(
        String token,
        String tokenType,
        long expiresInMs,
        Long userId,
        String email,
        Set<String> roles
) {
}
