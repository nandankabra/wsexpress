package com.shiptrack.tracking.event;

import com.shiptrack.tracking.document.TrackingEventType;

import java.time.Instant;

public record TrackingUpdatedEvent(
        String eventType,
        Long shipmentId,
        String trackingNumber,
        TrackingEventType trackingEventType,
        String location,
        Instant occurredAt
) {
    public static TrackingUpdatedEvent of(Long shipmentId, String trackingNumber, TrackingEventType type, String location) {
        return new TrackingUpdatedEvent("tracking.updated", shipmentId, trackingNumber, type, location, Instant.now());
    }
}
