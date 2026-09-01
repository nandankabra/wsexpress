package com.shiptrack.tracking.dto;

import com.shiptrack.tracking.document.TrackingEventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateTrackingEventRequest(
        @NotNull Long shipmentId,
        @NotBlank String trackingNumber,
        @NotNull TrackingEventType eventType,
        @NotBlank String location,
        String description
) {
}
