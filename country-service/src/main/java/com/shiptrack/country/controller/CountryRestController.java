package com.shiptrack.country.controller;

import com.shiptrack.country.client.SoapCountryClient;
import com.shiptrack.country.domain.CountryDataSource;
import com.shiptrack.country.domain.CountryRecord;
import com.shiptrack.country.dto.CountryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST facade for internal service-to-service consumption (Quote Service, GraphQL Service).
 * GET /{code} genuinely round-trips through the local SOAP endpoint via SoapCountryClient, so
 * REST callers of Country Service are transparently backed by a real SOAP call underneath.
 */
@RestController
@RequestMapping("/api/countries")
@RequiredArgsConstructor
@Tag(name = "Countries", description = "Country / currency / region metadata, backed by a SOAP endpoint")
public class CountryRestController {

    private final SoapCountryClient soapCountryClient;
    private final CountryDataSource countryDataSource;

    @GetMapping("/{code}")
    @Operation(summary = "Get country metadata by ISO code (round-trips through the SOAP endpoint)")
    public ResponseEntity<CountryResponse> getCountry(@PathVariable String code) {
        var soapResponse = soapCountryClient.getCountry(code).getCountry();
        return ResponseEntity.ok(new CountryResponse(soapResponse.getCode(), soapResponse.getName(),
                soapResponse.getCurrencyCode(), soapResponse.getRegion(), soapResponse.getCapital()));
    }

    @GetMapping
    @Operation(summary = "List all known countries")
    public ResponseEntity<List<CountryResponse>> listCountries() {
        List<CountryResponse> countries = countryDataSource.findAll().stream()
                .map(r -> new CountryResponse(r.code(), r.name(), r.currencyCode(), r.region(), r.capital()))
                .toList();
        return ResponseEntity.ok(countries);
    }
}
