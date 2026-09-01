package com.shiptrack.tracking.mapper;

import com.shiptrack.tracking.document.TrackingEvent;
import com.shiptrack.tracking.dto.TrackingEventResponse;
import org.springframework.stereotype.Component;

@Component
public class TrackingEventMapper {
    public TrackingEventResponse toResponse(TrackingEvent event) {
        return new TrackingEventResponse(event.getId(), event.getShipmentId(), event.getTrackingNumber(),
                event.getEventType(), event.getLocation(), event.getDescription(), event.getSource(),
                event.getOccurredAt());
    }
}
