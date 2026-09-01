package com.shiptrack.quote.client;

public record CountryInfoDto(
        String code,
        String name,
        String currencyCode,
        String region,
        String capital
) {
}
