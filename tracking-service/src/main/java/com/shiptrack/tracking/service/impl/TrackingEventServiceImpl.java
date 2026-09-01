package com.shiptrack.tracking.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiptrack.tracking.document.CarrierPayload;
import com.shiptrack.tracking.document.EventSource;
import com.shiptrack.tracking.document.TrackingEvent;
import com.shiptrack.tracking.document.TrackingEventType;
import com.shiptrack.tracking.dto.CarrierWebhookRequest;
import com.shiptrack.tracking.dto.CreateTrackingEventRequest;
import com.shiptrack.tracking.event.TrackingEventPublisher;
import com.shiptrack.tracking.event.TrackingUpdatedEvent;
import com.shiptrack.tracking.repository.CarrierPayloadRepository;
import com.shiptrack.tracking.repository.TrackingEventCursorRepository;
import com.shiptrack.tracking.repository.TrackingEventRepository;
import com.shiptrack.tracking.service.TrackingEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TrackingEventServiceImpl implements TrackingEventService {

    private final TrackingEventRepository trackingEventRepository;
    private final TrackingEventCursorRepository cursorRepository;
    private final CarrierPayloadRepository carrierPayloadRepository;
    private final TrackingEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    @Override
    public TrackingEvent recordEvent(CreateTrackingEventRequest request) {
        TrackingEvent event = new TrackingEvent();
        event.setShipmentId(request.shipmentId());
        event.setTrackingNumber(request.trackingNumber());
        event.setEventType(request.eventType());
        event.setLocation(request.location());
        event.setDescription(request.description());
        event.setSource(EventSource.INTERNAL);

        event = trackingEventRepository.save(event);
        eventPublisher.publish(TrackingUpdatedEvent.of(event.getShipmentId(), event.getTrackingNumber(),
                event.getEventType(), event.getLocation()));
        return event;
    }

    @Override
    public TrackingEvent recordFromWebhook(CarrierWebhookRequest request) {
        CarrierPayload payload = new CarrierPayload();
        payload.setCarrierId(request.carrierId());
        payload.setRawPayload(toJson(request));

        TrackingEvent event = new TrackingEvent();
        event.setShipmentId(request.shipmentId());
        event.setTrackingNumber(request.trackingNumber());
        event.setEventType(mapCarrierStatus(request.status()));
        event.setLocation(request.location());
        event.setDescription(request.note());
        event.setSource(EventSource.CARRIER_WEBHOOK);
        event = trackingEventRepository.save(event);

        payload.setResultingTrackingEventId(event.getId());
        carrierPayloadRepository.save(payload);

        eventPublisher.publish(TrackingUpdatedEvent.of(event.getShipmentId(), event.getTrackingNumber(),
                event.getEventType(), event.getLocation()));
        return event;
    }

    @Override
    public List<TrackingEvent> findPage(String cursor, int limit) {
        return cursorRepository.findPage(cursor, limit);
    }

    @Override
    public List<TrackingEvent> findByShipmentId(Long shipmentId) {
        return trackingEventRepository.findByShipmentIdOrderByOccurredAtDesc(shipmentId);
    }

    private TrackingEventType mapCarrierStatus(String status) {
        try {
            return TrackingEventType.valueOf(status.trim().toUpperCase().replace(' ', '_'));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown carrier status '" + status + "'; expected one of "
                    + java.util.Arrays.toString(TrackingEventType.values()));
        }
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return String.valueOf(value);
        }
    }
}
