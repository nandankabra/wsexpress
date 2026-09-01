package com.shiptrack.shipment.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** Records the result of a previously processed request so a retried POST with the same
 *  Idempotency-Key returns the original response instead of creating a duplicate shipment. */
@Entity
@Table(name = "idempotency_keys")
@Getter
@Setter
@NoArgsConstructor
public class IdempotencyKey {

    @Id
    @Column(name = "idempotency_key", length = 128)
    private String key;

    @Column(nullable = false, length = 64)
    private String requestHash;

    @Column(nullable = false)
    private Integer responseStatus;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String responseBody;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public IdempotencyKey(String key, String requestHash, Integer responseStatus, String responseBody) {
        this.key = key;
        this.requestHash = requestHash;
        this.responseStatus = responseStatus;
        this.responseBody = responseBody;
    }
}
