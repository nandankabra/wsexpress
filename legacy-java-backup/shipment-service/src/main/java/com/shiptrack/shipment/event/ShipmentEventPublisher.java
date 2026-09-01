package com.shiptrack.shipment.event;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/** Publishes shipment lifecycle events to Kafka for Notification Service (and anyone else) to consume. */
@Component
@RequiredArgsConstructor
public class ShipmentEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(ShipmentEventPublisher.class);
    public static final String TOPIC = "shipment-events";

    private final KafkaTemplate<String, ShipmentEvent> kafkaTemplate;

    public void publish(ShipmentEvent event) {
        kafkaTemplate.send(TOPIC, event.trackingNumber(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.warn("Failed to publish shipment event {} for {}", event.eventType(),
                                event.trackingNumber(), ex);
                    } else {
                        log.debug("Published {} for {}", event.eventType(), event.trackingNumber());
                    }
                });
    }
}
