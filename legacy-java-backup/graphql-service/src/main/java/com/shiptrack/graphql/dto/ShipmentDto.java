package com.shiptrack.graphql.dto;

public record ShipmentDto(
        Long id,
        String trackingNumber,
        String senderName,
        String senderAddress,
        String receiverName,
        String receiverAddress,
        String originCountryCode,
        String destinationCountryCode,
        Double weightKg,
        String status,
        String createdAt
) {
}
