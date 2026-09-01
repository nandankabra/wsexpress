package com.shiptrack.shipment.repository;

import com.shiptrack.shipment.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long>, JpaSpecificationExecutor<Shipment> {
    Optional<Shipment> findByTrackingNumber(String trackingNumber);
}
