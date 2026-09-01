package com.shiptrack.shipment.dto;

import com.shiptrack.shipment.entity.ShipmentStatus;

/** All fields optional — only non-null fields are applied (JSON merge-patch style). */
public record ShipmentPatchRequest(
        String senderName,
        String senderAddress,
        String receiverName,
        String receiverAddress,
        ShipmentStatus status,
        Double weightKg
) {
}
