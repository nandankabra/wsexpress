package com.shiptrack.graphql.dto;

public record TrackingEventDto(
        String id,
        Long shipmentId,
        String trackingNumber,
        String eventType,
        String location,
        String description,
        String occurredAt
) {
}
