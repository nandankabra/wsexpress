package com.shiptrack.country.client;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.oxm.jaxb.Jaxb2Marshaller;
import org.springframework.ws.client.core.WebServiceTemplate;

/** Wires a generated-client-style WebServiceTemplate around the same JAXB classes the endpoint
 *  uses, marshalling/unmarshalling real SOAP envelopes over HTTP to the local SOAP endpoint —
 *  the "generated SOAP client" side of the contract-first round trip. */
@Configuration
public class SoapClientConfig {

    @Bean
    public Jaxb2Marshaller countryMarshaller() {
        Jaxb2Marshaller marshaller = new Jaxb2Marshaller();
        marshaller.setContextPath("com.shiptrack.country.wsdl");
        return marshaller;
    }

    @Bean
    public WebServiceTemplate countryWebServiceTemplate(Jaxb2Marshaller countryMarshaller) {
        WebServiceTemplate template = new WebServiceTemplate();
        template.setMarshaller(countryMarshaller);
        template.setUnmarshaller(countryMarshaller);
        return template;
    }
}
