package com.shiptrack.shipment.repository;

import com.shiptrack.shipment.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
