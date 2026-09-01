package com.shiptrack.shipment.dto;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import com.shiptrack.shipment.entity.ShipmentStatus;

import java.time.Instant;

@JacksonXmlRootElement(localName = "shipment")
public record ShipmentResponse(
        Long id,
        String trackingNumber,
        String senderName,
        String senderAddress,
        String receiverName,
        String receiverAddress,
        String originCountryCode,
        String destinationCountryCode,
        Double weightKg,
        ShipmentStatus status,
        Long createdByUserId,
        Instant createdAt,
        Instant updatedAt,
        Long version
) {
}
