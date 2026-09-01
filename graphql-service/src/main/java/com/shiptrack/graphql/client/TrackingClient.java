package com.shiptrack.graphql.client;

import com.shiptrack.graphql.dto.CreateTrackingEventRequest;
import com.shiptrack.graphql.dto.TrackingEventDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@FeignClient(name = "TRACKING-SERVICE")
public interface TrackingClient {

    @GetMapping("/api/shipments/{id}/events")
    List<TrackingEventDto> historyForShipment(@PathVariable("id") Long shipmentId);

    @PostMapping("/api/events")
    TrackingEventDto createEvent(@RequestBody CreateTrackingEventRequest request);
}
