package com.shiptrack.country.ws;

import com.shiptrack.country.domain.CountryDataSource;
import com.shiptrack.country.domain.CountryRecord;
import com.shiptrack.country.wsdl.*;
import lombok.RequiredArgsConstructor;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

/** Contract-first SOAP endpoint: request/response shapes come entirely from the generated JAXB
 *  classes (com.shiptrack.country.wsdl), which in turn come from countries.xsd — there is no
 *  hand-written wire format here. */
@Endpoint
@RequiredArgsConstructor
public class CountryEndpoint {

    private static final String NAMESPACE = "http://shiptrack.dev/country-service/schemas";

    private final CountryDataSource countryDataSource;

    @PayloadRoot(namespace = NAMESPACE, localPart = "getCountryRequest")
    @ResponsePayload
    public GetCountryResponse getCountry(@RequestPayload GetCountryRequest request) throws CountryNotFoundSoapFault {
        CountryRecord record = countryDataSource.findByCode(request.getCountryCode())
                .orElseThrow(() -> new CountryNotFoundSoapFault(
                        "No country registered for code '" + request.getCountryCode() + "'"));

        GetCountryResponse response = new GetCountryResponse();
        response.setCountry(toSoapCountry(record));
        return response;
    }

    @PayloadRoot(namespace = NAMESPACE, localPart = "listCountriesRequest")
    @ResponsePayload
    public ListCountriesResponse listCountries(@RequestPayload ListCountriesRequest request) {
        ListCountriesResponse response = new ListCountriesResponse();
        countryDataSource.findAll().forEach(record -> response.getCountry().add(toSoapCountry(record)));
        return response;
    }

    private Country toSoapCountry(CountryRecord record) {
        Country country = new Country();
        country.setCode(record.code());
        country.setName(record.name());
        country.setCurrencyCode(record.currencyCode());
        country.setRegion(record.region());
        country.setCapital(record.capital());
        return country;
    }
}
