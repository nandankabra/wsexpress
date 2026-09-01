package com.shiptrack.graphql.client;

import com.shiptrack.graphql.dto.QuoteDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "QUOTE-SERVICE", path = "/api/quotes")
public interface QuoteClient {

    @GetMapping("/{id}")
    QuoteDto getById(@PathVariable("id") Long id);
}
