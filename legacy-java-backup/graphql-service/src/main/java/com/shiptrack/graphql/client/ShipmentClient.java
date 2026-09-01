package com.shiptrack.graphql.client;

import com.shiptrack.graphql.dto.CreateShipmentRequest;
import com.shiptrack.graphql.dto.PageResponseDto;
import com.shiptrack.graphql.dto.ShipmentDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "SHIPMENT-SERVICE", path = "/api/shipments")
public interface ShipmentClient {

    @GetMapping("/{id}")
    ShipmentDto getById(@PathVariable("id") Long id);

    @GetMapping
    PageResponseDto<ShipmentDto> list(@RequestParam("page") int page, @RequestParam("size") int size);

    @PostMapping
    ShipmentDto create(@RequestBody CreateShipmentRequest request);
}
