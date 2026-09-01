package com.shiptrack.tracking.dto;

import com.shiptrack.tracking.document.EventSource;
import com.shiptrack.tracking.document.TrackingEventType;

import java.time.Instant;

public record TrackingEventResponse(
        String id,
        Long shipmentId,
        String trackingNumber,
        TrackingEventType eventType,
        String location,
        String description,
        EventSource source,
        Instant occurredAt
) {
}
