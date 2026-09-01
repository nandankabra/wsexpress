package com.shiptrack.tracking.document;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/** One row per mutating request handled by Tracking Service — method, path, correlation id,
 *  status and latency — independent of business-level tracking events. */
@Document(collection = "request_audit")
@Getter
@Setter
@NoArgsConstructor
public class RequestAudit {

    @Id
    private String id;

    private String correlationId;
    private String method;
    private String path;
    private int statusCode;
    private long durationMs;
    private Instant timestamp = Instant.now();

    public RequestAudit(String correlationId, String method, String path, int statusCode, long durationMs) {
        this.correlationId = correlationId;
        this.method = method;
        this.path = path;
        this.statusCode = statusCode;
        this.durationMs = durationMs;
    }
}
