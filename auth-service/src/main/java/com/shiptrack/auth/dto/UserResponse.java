package com.shiptrack.auth.dto;

import java.time.Instant;
import java.util.Set;

public record UserResponse(
        Long id,
        String email,
        String fullName,
        boolean enabled,
        Set<String> roles,
        Instant createdAt
) {
}
