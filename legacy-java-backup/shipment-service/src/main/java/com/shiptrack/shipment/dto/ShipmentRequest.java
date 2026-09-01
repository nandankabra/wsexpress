package com.shiptrack.shipment.dto;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

@JacksonXmlRootElement(localName = "shipmentRequest")
public record ShipmentRequest(
        @NotBlank String senderName,
        @NotBlank String senderAddress,
        @NotBlank String receiverName,
        @NotBlank String receiverAddress,
        @NotBlank @Pattern(regexp = "^[A-Z]{2}$", message = "must be a 2-letter ISO country code") String originCountryCode,
        @NotBlank @Pattern(regexp = "^[A-Z]{2}$", message = "must be a 2-letter ISO country code") String destinationCountryCode,
        @Positive Double weightKg
) {
}
