package com.shiptrack.tracking.event;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TrackingEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(TrackingEventPublisher.class);
    public static final String TOPIC = "tracking-events";

    private final KafkaTemplate<String, TrackingUpdatedEvent> kafkaTemplate;

    public void publish(TrackingUpdatedEvent event) {
        kafkaTemplate.send(TOPIC, event.trackingNumber(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.warn("Failed to publish tracking event for {}", event.trackingNumber(), ex);
                    }
                });
    }
}
