package com.shiptrack.shipment.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "shipments")
@Getter
@Setter
@NoArgsConstructor
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String trackingNumber;

    @Column(nullable = false)
    private String senderName;

    @Column(nullable = false)
    private String senderAddress;

    @Column(nullable = false)
    private String receiverName;

    @Column(nullable = false)
    private String receiverAddress;

    @Column(nullable = false, length = 2)
    private String originCountryCode;

    @Column(nullable = false, length = 2)
    private String destinationCountryCode;

    @Column(nullable = false)
    private Double weightKg;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ShipmentStatus status = ShipmentStatus.CREATED;

    @Column(nullable = false)
    private Long createdByUserId;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    /** Backs both JPA optimistic locking (If-Match conflicts -> 409/412) and the entity's ETag. */
    @Version
    @Column(nullable = false)
    private Long version;

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public String etag() {
        return "\"" + id + "-" + version + "\"";
    }
}
