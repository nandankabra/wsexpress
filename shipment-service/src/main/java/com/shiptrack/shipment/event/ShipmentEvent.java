package com.shiptrack.shipment.event;

import com.shiptrack.shipment.entity.ShipmentStatus;

import java.time.Instant;

public record ShipmentEvent(
        String eventType,
        Long shipmentId,
        String trackingNumber,
        ShipmentStatus status,
        Long actorUserId,
        Instant occurredAt
) {
    public static ShipmentEvent of(String eventType, Long shipmentId, String trackingNumber,
            ShipmentStatus status, Long actorUserId) {
        return new ShipmentEvent(eventType, shipmentId, trackingNumber, status, actorUserId, Instant.now());
    }
}
