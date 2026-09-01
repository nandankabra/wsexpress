package com.shiptrack.country.domain;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/** Fixed in-memory country/currency/region reference data — the "system of record" the SOAP
 *  endpoint (and everything downstream of it) enriches shipments and quotes from. */
@Component
public class CountryDataSource {

    private final Map<String, CountryRecord> byCode;

    public CountryDataSource() {
        List<CountryRecord> countries = List.of(
                new CountryRecord("US", "United States", "USD", "AMERICAS", "Washington, D.C."),
                new CountryRecord("CA", "Canada", "CAD", "AMERICAS", "Ottawa"),
                new CountryRecord("MX", "Mexico", "MXN", "AMERICAS", "Mexico City"),
                new CountryRecord("BR", "Brazil", "BRL", "AMERICAS", "Brasília"),
                new CountryRecord("GB", "United Kingdom", "GBP", "EUROPE", "London"),
                new CountryRecord("DE", "Germany", "EUR", "EUROPE", "Berlin"),
                new CountryRecord("FR", "France", "EUR", "EUROPE", "Paris"),
                new CountryRecord("IT", "Italy", "EUR", "EUROPE", "Rome"),
                new CountryRecord("ES", "Spain", "EUR", "EUROPE", "Madrid"),
                new CountryRecord("NL", "Netherlands", "EUR", "EUROPE", "Amsterdam"),
                new CountryRecord("IN", "India", "INR", "ASIA", "New Delhi"),
                new CountryRecord("CN", "China", "CNY", "ASIA", "Beijing"),
                new CountryRecord("JP", "Japan", "JPY", "ASIA", "Tokyo"),
                new CountryRecord("SG", "Singapore", "SGD", "ASIA", "Singapore"),
                new CountryRecord("AE", "United Arab Emirates", "AED", "ASIA", "Abu Dhabi"),
                new CountryRecord("AU", "Australia", "AUD", "OCEANIA", "Canberra"),
                new CountryRecord("NZ", "New Zealand", "NZD", "OCEANIA", "Wellington"),
                new CountryRecord("ZA", "South Africa", "ZAR", "AFRICA", "Pretoria"),
                new CountryRecord("NG", "Nigeria", "NGN", "AFRICA", "Abuja"),
                new CountryRecord("EG", "Egypt", "EGP", "AFRICA", "Cairo")
        );
        this.byCode = countries.stream().collect(Collectors.toMap(CountryRecord::code, c -> c));
    }

    public Optional<CountryRecord> findByCode(String code) {
        return Optional.ofNullable(byCode.get(code == null ? null : code.toUpperCase()));
    }

    public List<CountryRecord> findAll() {
        return byCode.values().stream()
                .sorted((a, b) -> a.code().compareTo(b.code()))
                .collect(Collectors.toList());
    }
}
