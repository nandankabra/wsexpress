package com.shiptrack.tracking.service;

import com.shiptrack.tracking.document.TrackingEvent;
import com.shiptrack.tracking.dto.CarrierWebhookRequest;
import com.shiptrack.tracking.dto.CreateTrackingEventRequest;

import java.util.List;

public interface TrackingEventService {

    TrackingEvent recordEvent(CreateTrackingEventRequest request);

    TrackingEvent recordFromWebhook(CarrierWebhookRequest request);

    List<TrackingEvent> findPage(String cursor, int limit);

    List<TrackingEvent> findByShipmentId(Long shipmentId);
}
