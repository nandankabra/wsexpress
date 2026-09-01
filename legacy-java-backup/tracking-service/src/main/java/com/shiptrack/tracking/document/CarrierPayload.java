package com.shiptrack.tracking.document;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/** Raw capture of every inbound carrier webhook call, kept for audit/replay independent of how
 *  it was interpreted into a TrackingEvent. */
@Document(collection = "carrier_payloads")
@Getter
@Setter
@NoArgsConstructor
public class CarrierPayload {

    @Id
    private String id;

    private String carrierId;
    private String rawPayload;
    private String resultingTrackingEventId;
    private Instant receivedAt = Instant.now();
}
