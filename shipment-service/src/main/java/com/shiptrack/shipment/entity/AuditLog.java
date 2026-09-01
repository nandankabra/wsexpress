package com.shiptrack.shipment.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String action;

    @Column(nullable = false, length = 50)
    private String entityType;

    @Column(nullable = false)
    private Long entityId;

    private Long performedByUserId;

    @Column(nullable = false)
    private Instant timestamp = Instant.now();

    @Column(columnDefinition = "TEXT")
    private String details;

    public AuditLog(String action, String entityType, Long entityId, Long performedByUserId, String details) {
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.performedByUserId = performedByUserId;
        this.details = details;
    }
}
