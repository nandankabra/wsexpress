package com.shiptrack.tracking.document;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "tracking_events")
@Getter
@Setter
@NoArgsConstructor
public class TrackingEvent {

    @Id
    private String id;

    @Indexed
    private Long shipmentId;

    @Indexed
    private String trackingNumber;

    private TrackingEventType eventType;
    private String location;
    private String description;
    private EventSource source = EventSource.INTERNAL;
    private Instant occurredAt = Instant.now();
    private Instant createdAt = Instant.now();
}
