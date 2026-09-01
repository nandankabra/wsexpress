package com.shiptrack.graphql.dto;

public record QuoteDto(
        Long id,
        String originCountryCode,
        String destinationCountryCode,
        Double weightKg,
        String carrierName,
        java.math.BigDecimal amount,
        String currency
) {
}
