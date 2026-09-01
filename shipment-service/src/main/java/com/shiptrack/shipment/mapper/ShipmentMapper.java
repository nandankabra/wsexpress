package com.shiptrack.shipment.mapper;

import com.shiptrack.shipment.dto.ShipmentResponse;
import com.shiptrack.shipment.entity.Shipment;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ShipmentMapper {
    ShipmentResponse toResponse(Shipment shipment);
}
