package com.shiptrack.quote.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "COUNTRY-SERVICE", path = "/api/countries")
public interface CountryServiceClient {

    @GetMapping("/{code}")
    CountryInfoDto getCountry(@PathVariable("code") String code);
}
