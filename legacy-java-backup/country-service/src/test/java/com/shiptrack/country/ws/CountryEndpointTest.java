package com.shiptrack.country.ws;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.ws.test.server.MockWebServiceClient;
import org.springframework.ws.test.server.RequestCreators;
import org.springframework.ws.test.server.ResponseMatchers;
import org.springframework.xml.transform.StringSource;

import javax.xml.transform.Source;

@SpringBootTest(properties = {"eureka.client.enabled=false", "spring.cloud.config.enabled=false"})
class CountryEndpointTest {

    @Autowired
    private ApplicationContext applicationContext;

    private MockWebServiceClient client;

    @BeforeEach
    void setUp() {
        client = MockWebServiceClient.createClient(applicationContext);
    }

    @Test
    void getCountry_forKnownCode_returnsCountryMetadata() throws Exception {
        Source requestPayload = new StringSource(
                "<ns:getCountryRequest xmlns:ns=\"http://shiptrack.dev/country-service/schemas\">"
                        + "<ns:countryCode>US</ns:countryCode>"
                        + "</ns:getCountryRequest>");

        Source expectedResponse = new StringSource(
                "<ns:getCountryResponse xmlns:ns=\"http://shiptrack.dev/country-service/schemas\">"
                        + "<ns:country>"
                        + "<ns:code>US</ns:code>"
                        + "<ns:name>United States</ns:name>"
                        + "<ns:currencyCode>USD</ns:currencyCode>"
                        + "<ns:region>AMERICAS</ns:region>"
                        + "<ns:capital>Washington, D.C.</ns:capital>"
                        + "</ns:country>"
                        + "</ns:getCountryResponse>");

        client.sendRequest(RequestCreators.withPayload(requestPayload))
                .andExpect(ResponseMatchers.noFault())
                .andExpect(ResponseMatchers.payload(expectedResponse));
    }

    @Test
    void getCountry_forUnknownCode_returnsSoapFault() throws Exception {
        Source requestPayload = new StringSource(
                "<ns:getCountryRequest xmlns:ns=\"http://shiptrack.dev/country-service/schemas\">"
                        + "<ns:countryCode>ZZ</ns:countryCode>"
                        + "</ns:getCountryRequest>");

        client.sendRequest(RequestCreators.withPayload(requestPayload))
                .andExpect(ResponseMatchers.clientOrSenderFault("No country registered for code 'ZZ'"));
    }
}
