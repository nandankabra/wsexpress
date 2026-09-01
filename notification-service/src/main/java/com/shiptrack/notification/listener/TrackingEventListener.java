package com.shiptrack.notification.listener;

import com.shiptrack.notification.service.NotificationDispatcher;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

/** Consumes tracking-events (tracking.updated) published by Tracking Service. */
@Component
@RequiredArgsConstructor
public class TrackingEventListener {

    private final NotificationDispatcher dispatcher;

    @KafkaListener(topics = "tracking-events", groupId = "notification-service")
    public void onTrackingEvent(Map<String, Object> event) {
        String trackingNumber = String.valueOf(event.get("trackingNumber"));
        String eventType = String.valueOf(event.get("trackingEventType"));
        String location = String.valueOf(event.get("location"));

        String message = "Shipment " + trackingNumber + " is now " + eventType + " at " + location;
        dispatcher.dispatch("SMS", "tracking.updated", message);
    }
}
