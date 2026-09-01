package com.shiptrack.quote.service;

import com.shiptrack.quote.client.CountryInfoDto;
import com.shiptrack.quote.client.CountryServiceClient;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Wraps the Feign call to Country Service (which is itself a SOAP client underneath) with a
 * bounded per-call timeout (feign.client.config.country-service.read-timeout), automatic retry
 * of transient failures, and a circuit breaker that trips to the fallback once Country Service
 * is consistently failing — so a struggling downstream never cascades into slow/blocked quotes.
 */
@Service
@RequiredArgsConstructor
public class CountryLookupService {

    private static final Logger log = LoggerFactory.getLogger(CountryLookupService.class);
    private static final String INSTANCE = "countryService";

    private final CountryServiceClient countryServiceClient;

    @Retry(name = INSTANCE)
    @CircuitBreaker(name = INSTANCE, fallbackMethod = "fallbackCountry")
    public CountryInfoDto lookup(String countryCode) {
        return countryServiceClient.getCountry(countryCode);
    }

    @SuppressWarnings("unused")
    private CountryInfoDto fallbackCountry(String countryCode, Throwable throwable) {
        log.warn("Country Service unavailable for '{}', using fallback pricing metadata: {}",
                countryCode, throwable.toString());
        return new CountryInfoDto(countryCode, "Unknown", "USD", "UNKNOWN", "Unknown");
    }
}
