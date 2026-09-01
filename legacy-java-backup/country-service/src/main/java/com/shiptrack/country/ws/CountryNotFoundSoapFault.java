package com.shiptrack.country.ws;

import org.springframework.ws.soap.server.endpoint.annotation.FaultCode;
import org.springframework.ws.soap.server.endpoint.annotation.SoapFault;

@SoapFault(faultCode = FaultCode.CLIENT)
public class CountryNotFoundSoapFault extends Exception {
    public CountryNotFoundSoapFault(String message) {
        super(message);
    }
}
