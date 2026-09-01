package com.shiptrack.graphql.resolver;

import com.shiptrack.graphql.client.ShipmentClient;
import com.shiptrack.graphql.dto.CreateShipmentRequest;
import com.shiptrack.graphql.dto.ShipmentDto;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class ShipmentGraphQLController {

    private final ShipmentClient shipmentClient;

    @QueryMapping
    public ShipmentDto shipment(@Argument Long id) {
        return shipmentClient.getById(id);
    }

    @QueryMapping
    public List<ShipmentDto> shipments(@Argument int page, @Argument int size) {
        return shipmentClient.list(page, size).content();
    }

    @MutationMapping
    public ShipmentDto createShipment(@Argument CreateShipmentRequest input) {
        return shipmentClient.create(input);
    }
}
