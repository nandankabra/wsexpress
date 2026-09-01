package com.shiptrack.quote.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record QuoteResponse(
        Long id,
        String originCountryCode,
        String destinationCountryCode,
        Double weightKg,
        String carrierName,
        BigDecimal amount,
        String currency,
        Instant createdAt
) {
}
