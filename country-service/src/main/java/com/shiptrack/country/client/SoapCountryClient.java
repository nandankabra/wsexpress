package com.shiptrack.country.client;

import com.shiptrack.common.exception.ResourceNotFoundException;
import com.shiptrack.country.wsdl.GetCountryRequest;
import com.shiptrack.country.wsdl.GetCountryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.ws.client.core.WebServiceTemplate;
import org.springframework.ws.soap.client.SoapFaultClientException;

/**
 * The REST wrapper controller delegates here instead of reading CountryDataSource directly, so
 * every REST call genuinely round-trips through the SOAP endpoint (marshal request -> POST SOAP
 * envelope -> unmarshal response) exactly as an external SOAP consumer would.
 */
@Component
@RequiredArgsConstructor
public class SoapCountryClient {

    private final WebServiceTemplate webServiceTemplate;

    @Value("${country.soap.endpoint-uri:http://localhost:8085/ws}")
    private String endpointUri;

    public GetCountryResponse getCountry(String code) {
        GetCountryRequest request = new GetCountryRequest();
        request.setCountryCode(code);
        try {
            return (GetCountryResponse) webServiceTemplate.marshalSendAndReceive(endpointUri, request);
        } catch (SoapFaultClientException ex) {
            throw new ResourceNotFoundException("Country '" + code + "' not found: " + ex.getMessage());
        }
    }
}
