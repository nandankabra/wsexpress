package com.shiptrack.graphql.dto;

public record CreateShipmentRequest(
        String senderName,
        String senderAddress,
        String receiverName,
        String receiverAddress,
        String originCountryCode,
        String destinationCountryCode,
        Double weightKg
) {
}
