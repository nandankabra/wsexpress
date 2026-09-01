package com.shiptrack.graphql.dto;

public record CreateTrackingEventRequest(
        Long shipmentId,
        String trackingNumber,
        String eventType,
        String location,
        String description
) {
}
