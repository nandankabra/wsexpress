package com.shiptrack.notification.listener;

import com.shiptrack.notification.service.NotificationDispatcher;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

/** Consumes shipment-events (shipment.created / shipment.updated) published by Shipment Service. */
@Component
@RequiredArgsConstructor
public class ShipmentEventListener {

    private final NotificationDispatcher dispatcher;

    @KafkaListener(topics = "shipment-events", groupId = "notification-service")
    public void onShipmentEvent(Map<String, Object> event) {
        String eventType = String.valueOf(event.get("eventType"));
        String trackingNumber = String.valueOf(event.get("trackingNumber"));
        String status = String.valueOf(event.get("status"));

        String message = switch (eventType) {
            case "shipment.created" -> "Shipment " + trackingNumber + " has been created and is now " + status;
            case "shipment.updated" -> "Shipment " + trackingNumber + " was updated to status " + status;
            default -> "Shipment " + trackingNumber + " event: " + eventType;
        };
        dispatcher.dispatch("EMAIL", eventType, message);
    }
}
