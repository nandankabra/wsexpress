package com.shiptrack.shipment.controller;

import com.shiptrack.common.constants.Headers;
import com.shiptrack.common.constants.SecurityConstants;
import com.shiptrack.common.exception.PreconditionFailedException;
import com.shiptrack.shipment.dto.ShipmentPatchRequest;
import com.shiptrack.shipment.dto.ShipmentRequest;
import com.shiptrack.shipment.dto.ShipmentResponse;
import com.shiptrack.shipment.entity.Shipment;
import com.shiptrack.shipment.mapper.ShipmentMapper;
import com.shiptrack.shipment.service.ShipmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
@Tag(name = "Shipments", description = "Shipment CRUD with ETag / conditional requests / idempotency")
public class ShipmentController {

    private final ShipmentService shipmentService;
    private final ShipmentMapper shipmentMapper;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE})
    @Operation(summary = "Create a shipment (supports Idempotency-Key replay)")
    public ResponseEntity<ShipmentResponse> create(
            @Valid @RequestBody ShipmentRequest request,
            @RequestHeader(value = Headers.IDEMPOTENCY_KEY, required = false) String idempotencyKey,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long userId) {

        var result = shipmentService.create(request, idempotencyKey, userId);
        ShipmentResponse body = shipmentMapper.toResponse(result.shipment());
        HttpStatus status = result.wasReplay() ? HttpStatus.OK : HttpStatus.CREATED;

        ResponseEntity.BodyBuilder builder = ResponseEntity.status(status)
                .eTag(result.shipment().etag())
                .cacheControl(CacheControl.noStore());
        if (!result.wasReplay()) {
            builder = builder.location(URI.create("/api/shipments/" + result.shipment().getId()));
        }
        return builder.body(body);
    }

    @GetMapping(produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE})
    @Operation(summary = "List shipments (paginated)")
    public ResponseEntity<Page<ShipmentResponse>> list(@PageableDefault(size = 20) Pageable pageable) {
        Page<ShipmentResponse> page = shipmentService.list(pageable).map(shipmentMapper::toResponse);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(30, TimeUnit.SECONDS).cachePrivate())
                .body(page);
    }

    @GetMapping(value = "/search", produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE})
    @Operation(summary = "Search shipments by status / destination / tracking number fragment")
    public ResponseEntity<Page<ShipmentResponse>> search(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String destinationCountryCode,
            @RequestParam(required = false) String trackingNumber,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ShipmentResponse> page = shipmentService
                .search(status, destinationCountryCode, trackingNumber, pageable)
                .map(shipmentMapper::toResponse);
        return ResponseEntity.ok().cacheControl(CacheControl.maxAge(30, TimeUnit.SECONDS).cachePrivate()).body(page);
    }

    @GetMapping(value = "/{id}", produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE})
    @Operation(summary = "Get a shipment by id (supports If-None-Match -> 304)")
    public ResponseEntity<ShipmentResponse> getById(
            @PathVariable Long id,
            @RequestHeader(value = HttpHeaders.IF_NONE_MATCH, required = false) String ifNoneMatch) {
        Shipment shipment = shipmentService.findById(id);
        String etag = shipment.etag();

        if (etag.equals(ifNoneMatch)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(etag).build();
        }

        return ResponseEntity.ok()
                .eTag(etag)
                .cacheControl(CacheControl.maxAge(30, TimeUnit.SECONDS).cachePrivate())
                .body(shipmentMapper.toResponse(shipment));
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE})
    @Operation(summary = "Partially update a shipment; requires If-Match with the current ETag")
    public ResponseEntity<ShipmentResponse> patch(
            @PathVariable Long id,
            @RequestBody ShipmentPatchRequest request,
            @RequestHeader(value = HttpHeaders.IF_MATCH, required = false) String ifMatch,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long userId) {

        long expectedVersion = parseVersionFromEtag(id, ifMatch);
        Shipment updated = shipmentService.patch(id, request, expectedVersion, userId);
        return ResponseEntity.ok().eTag(updated.etag()).cacheControl(CacheControl.noStore())
                .body(shipmentMapper.toResponse(updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a shipment; requires If-Match with the current ETag")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestHeader(value = HttpHeaders.IF_MATCH, required = false) String ifMatch,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long userId) {
        long expectedVersion = parseVersionFromEtag(id, ifMatch);
        shipmentService.delete(id, expectedVersion, userId);
        return ResponseEntity.noContent().build();
    }

    private long parseVersionFromEtag(Long id, String ifMatch) {
        if (ifMatch == null || ifMatch.isBlank()) {
            throw new PreconditionFailedException("If-Match header with the current ETag is required for this operation");
        }
        String unquoted = ifMatch.replace("\"", "");
        String prefix = id + "-";
        if (!unquoted.startsWith(prefix)) {
            throw new PreconditionFailedException("If-Match ETag does not correspond to shipment " + id);
        }
        try {
            return Long.parseLong(unquoted.substring(prefix.length()));
        } catch (NumberFormatException ex) {
            throw new PreconditionFailedException("Malformed If-Match ETag");
        }
    }
}
