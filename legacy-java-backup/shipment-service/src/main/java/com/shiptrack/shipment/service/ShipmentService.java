package com.shiptrack.shipment.service;

import com.shiptrack.shipment.dto.ShipmentPatchRequest;
import com.shiptrack.shipment.dto.ShipmentRequest;
import com.shiptrack.shipment.entity.Shipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ShipmentService {

    /** Returns the created shipment, or the entity produced by a previous call with the same
     *  idempotency key ({@code wasReplay} distinguishes the two for the controller's status code). */
    record CreateResult(Shipment shipment, boolean wasReplay) {
    }

    CreateResult create(ShipmentRequest request, String idempotencyKey, Long actorUserId);

    Shipment findById(Long id);

    Page<Shipment> list(Pageable pageable);

    Page<Shipment> search(String status, String destinationCountryCode, String trackingNumber, Pageable pageable);

    Shipment patch(Long id, ShipmentPatchRequest request, long expectedVersion, Long actorUserId);

    void delete(Long id, long expectedVersion, Long actorUserId);
}
