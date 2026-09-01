package com.shiptrack.auth.dto;

import java.util.Set;

public record ValidateResponse(
        boolean valid,
        Long userId,
        String email,
        Set<String> roles
) {
}
