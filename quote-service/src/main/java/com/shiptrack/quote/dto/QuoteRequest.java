package com.shiptrack.quote.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public record QuoteRequest(
        @NotBlank @Pattern(regexp = "^[A-Z]{2}$") String originCountryCode,
        @NotBlank @Pattern(regexp = "^[A-Z]{2}$") String destinationCountryCode,
        @Positive Double weightKg,
        String carrierName
) {
}
