package com.shiptrack.tracking.controller;

import com.shiptrack.tracking.dto.CreateTrackingEventRequest;
import com.shiptrack.tracking.dto.CursorPage;
import com.shiptrack.tracking.dto.TrackingEventResponse;
import com.shiptrack.tracking.mapper.TrackingEventMapper;
import com.shiptrack.tracking.service.TrackingEventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Tracking Events", description = "Shipment tracking event history with cursor pagination")
public class TrackingEventController {

    private final TrackingEventService trackingEventService;
    private final TrackingEventMapper mapper;

    @PostMapping("/api/events")
    @Operation(summary = "Record a tracking event for a shipment")
    public ResponseEntity<TrackingEventResponse> create(@Valid @RequestBody CreateTrackingEventRequest request) {
        var event = trackingEventService.recordEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(event));
    }

    @GetMapping("/api/events")
    @Operation(summary = "List tracking events, newest first, cursor-paginated")
    public ResponseEntity<CursorPage<TrackingEventResponse>> list(
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int limit) {
        int pageSize = Math.min(Math.max(limit, 1), 100);
        var events = trackingEventService.findPage(cursor, pageSize + 1);

        boolean hasMore = events.size() > pageSize;
        var page = hasMore ? events.subList(0, pageSize) : events;
        String nextCursor = hasMore ? page.get(page.size() - 1).getId() : null;

        List<TrackingEventResponse> body = page.stream().map(mapper::toResponse).toList();
        return ResponseEntity.ok(new CursorPage<>(body, nextCursor, hasMore));
    }

    @GetMapping("/api/shipments/{id}/events")
    @Operation(summary = "Full event history for one shipment")
    public ResponseEntity<List<TrackingEventResponse>> historyForShipment(@PathVariable("id") Long shipmentId) {
        var events = trackingEventService.findByShipmentId(shipmentId).stream().map(mapper::toResponse).toList();
        return ResponseEntity.ok(events);
    }
}
