package com.shiptrack.graphql.client;

import com.shiptrack.graphql.dto.CountryInfoDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "COUNTRY-SERVICE", path = "/api/countries")
public interface CountryClient {

    @GetMapping("/{code}")
    CountryInfoDto getCountry(@PathVariable("code") String code);
}
