package com.shiptrack.graphql.resolver;

import com.shiptrack.graphql.client.CountryClient;
import com.shiptrack.graphql.dto.CountryInfoDto;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class CountryGraphQLController {

    private final CountryClient countryClient;

    @QueryMapping
    public CountryInfoDto countryInfo(@Argument String code) {
        return countryClient.getCountry(code);
    }
}
