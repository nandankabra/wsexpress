package com.shiptrack.tracking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Payload shape a simulated external carrier system posts to /api/webhooks/carrier. */
public record CarrierWebhookRequest(
        @NotBlank String carrierId,
        @NotBlank String trackingNumber,
        @NotNull Long shipmentId,
        @NotBlank String status,
        String location,
        String note
) {
}
