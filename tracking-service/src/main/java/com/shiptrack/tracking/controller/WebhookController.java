package com.shiptrack.tracking.controller;

import com.shiptrack.tracking.dto.CarrierWebhookRequest;
import com.shiptrack.tracking.dto.TrackingEventResponse;
import com.shiptrack.tracking.mapper.TrackingEventMapper;
import com.shiptrack.tracking.service.TrackingEventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Tag(name = "Carrier Webhooks", description = "Simulated inbound carrier status update webhook")
public class WebhookController {

    private final TrackingEventService trackingEventService;
    private final TrackingEventMapper mapper;

    @PostMapping("/carrier")
    @Operation(summary = "Ingest a simulated carrier status update and translate it into a tracking event")
    public ResponseEntity<TrackingEventResponse> carrierWebhook(@Valid @RequestBody CarrierWebhookRequest request) {
        var event = trackingEventService.recordFromWebhook(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(event));
    }
}
