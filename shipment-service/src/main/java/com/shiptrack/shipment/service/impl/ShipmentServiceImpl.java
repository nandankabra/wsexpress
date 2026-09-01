package com.shiptrack.shipment.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiptrack.common.exception.ConflictException;
import com.shiptrack.common.exception.PreconditionFailedException;
import com.shiptrack.common.exception.ResourceNotFoundException;
import com.shiptrack.shipment.dto.ShipmentPatchRequest;
import com.shiptrack.shipment.dto.ShipmentRequest;
import com.shiptrack.shipment.dto.ShipmentResponse;
import com.shiptrack.shipment.entity.AuditLog;
import com.shiptrack.shipment.entity.IdempotencyKey;
import com.shiptrack.shipment.entity.Shipment;
import com.shiptrack.shipment.event.ShipmentEvent;
import com.shiptrack.shipment.event.ShipmentEventPublisher;
import com.shiptrack.shipment.mapper.ShipmentMapper;
import com.shiptrack.shipment.repository.AuditLogRepository;
import com.shiptrack.shipment.repository.IdempotencyKeyRepository;
import com.shiptrack.shipment.repository.ShipmentRepository;
import com.shiptrack.shipment.repository.ShipmentSpecifications;
import com.shiptrack.shipment.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShipmentServiceImpl implements ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final IdempotencyKeyRepository idempotencyKeyRepository;
    private final AuditLogRepository auditLogRepository;
    private final ShipmentMapper shipmentMapper;
    private final ShipmentEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public CreateResult create(ShipmentRequest request, String idempotencyKey, Long actorUserId) {
        String requestHash = hash(request);

        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            var existing = idempotencyKeyRepository.findById(idempotencyKey);
            if (existing.isPresent()) {
                IdempotencyKey record = existing.get();
                if (!record.getRequestHash().equals(requestHash)) {
                    throw new ConflictException(
                            "Idempotency-Key " + idempotencyKey + " was already used with a different request body");
                }
                Shipment replayed = readIdempotentShipment(record);
                return new CreateResult(replayed, true);
            }
        }

        Shipment shipment = new Shipment();
        shipment.setTrackingNumber(generateTrackingNumber());
        shipment.setSenderName(request.senderName());
        shipment.setSenderAddress(request.senderAddress());
        shipment.setReceiverName(request.receiverName());
        shipment.setReceiverAddress(request.receiverAddress());
        shipment.setOriginCountryCode(request.originCountryCode().toUpperCase());
        shipment.setDestinationCountryCode(request.destinationCountryCode().toUpperCase());
        shipment.setWeightKg(request.weightKg());
        shipment.setCreatedByUserId(actorUserId);

        shipment = shipmentRepository.save(shipment);
        audit("CREATE", shipment.getId(), actorUserId, "Shipment created: " + shipment.getTrackingNumber());
        eventPublisher.publish(ShipmentEvent.of("shipment.created", shipment.getId(), shipment.getTrackingNumber(),
                shipment.getStatus(), actorUserId));

        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            storeIdempotentResult(idempotencyKey, requestHash, shipment);
        }

        return new CreateResult(shipment, false);
    }

    @Override
    @Transactional(readOnly = true)
    public Shipment findById(Long id) {
        return shipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment " + id + " not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Shipment> list(Pageable pageable) {
        return shipmentRepository.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Shipment> search(String status, String destinationCountryCode, String trackingNumber, Pageable pageable) {
        var spec = ShipmentSpecifications.combine(
                ShipmentSpecifications.hasStatus(status),
                ShipmentSpecifications.hasDestination(destinationCountryCode),
                ShipmentSpecifications.trackingNumberContains(trackingNumber));
        return shipmentRepository.findAll(spec, pageable);
    }

    @Override
    @Transactional
    public Shipment patch(Long id, ShipmentPatchRequest request, long expectedVersion, Long actorUserId) {
        Shipment shipment = findById(id);

        if (!shipment.getVersion().equals(expectedVersion)) {
            throw new PreconditionFailedException(
                    "Shipment " + id + " has changed since it was last read (If-Match version mismatch)");
        }

        if (request.senderName() != null) shipment.setSenderName(request.senderName());
        if (request.senderAddress() != null) shipment.setSenderAddress(request.senderAddress());
        if (request.receiverName() != null) shipment.setReceiverName(request.receiverName());
        if (request.receiverAddress() != null) shipment.setReceiverAddress(request.receiverAddress());
        if (request.status() != null) shipment.setStatus(request.status());
        if (request.weightKg() != null) shipment.setWeightKg(request.weightKg());

        try {
            shipment = shipmentRepository.saveAndFlush(shipment);
        } catch (OptimisticLockingFailureException ex) {
            throw new PreconditionFailedException(
                    "Shipment " + id + " was concurrently modified; refetch and retry with the new ETag");
        }

        audit("UPDATE", shipment.getId(), actorUserId, "Shipment patched");
        eventPublisher.publish(ShipmentEvent.of("shipment.updated", shipment.getId(), shipment.getTrackingNumber(),
                shipment.getStatus(), actorUserId));
        return shipment;
    }

    @Override
    @Transactional
    public void delete(Long id, long expectedVersion, Long actorUserId) {
        Shipment shipment = findById(id);
        if (!shipment.getVersion().equals(expectedVersion)) {
            throw new PreconditionFailedException(
                    "Shipment " + id + " has changed since it was last read (If-Match version mismatch)");
        }
        shipmentRepository.delete(shipment);
        audit("DELETE", id, actorUserId, "Shipment deleted: " + shipment.getTrackingNumber());
    }

    private void audit(String action, Long entityId, Long actorUserId, String details) {
        auditLogRepository.save(new AuditLog(action, "Shipment", entityId, actorUserId, details));
    }

    private String generateTrackingNumber() {
        return "ST-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String hash(ShipmentRequest request) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(objectMapper.writeValueAsBytes(request));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException | com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("Unable to hash idempotency request body", e);
        }
    }

    private void storeIdempotentResult(String key, String requestHash, Shipment shipment) {
        try {
            String body = objectMapper.writeValueAsString(shipmentMapper.toResponse(shipment));
            idempotencyKeyRepository.save(new IdempotencyKey(key, requestHash, 201, body));
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("Unable to serialize idempotent response", e);
        }
    }

    private Shipment readIdempotentShipment(IdempotencyKey record) {
        try {
            ShipmentResponse response = objectMapper.readValue(record.getResponseBody(), ShipmentResponse.class);
            return shipmentRepository.findById(response.id())
                    .orElseThrow(() -> new ResourceNotFoundException("Replayed shipment no longer exists"));
        } catch (Exception e) {
            throw new IllegalStateException("Unable to replay idempotent response", e);
        }
    }
}
