package com.shiptrack.common.constants;

/** Shared HTTP header names used across every ShipTrack service. */
public final class Headers {

    private Headers() {
    }

    public static final String CORRELATION_ID = "X-Correlation-Id";
    public static final String IDEMPOTENCY_KEY = "Idempotency-Key";
    public static final String RATE_LIMIT_LIMIT = "X-RateLimit-Limit";
    public static final String RATE_LIMIT_REMAINING = "X-RateLimit-Remaining";
    public static final String RATE_LIMIT_RESET = "X-RateLimit-Reset";
}
