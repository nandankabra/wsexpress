package com.shiptrack.graphql.resolver;

import com.shiptrack.graphql.client.CountryClient;
import com.shiptrack.graphql.client.QuoteClient;
import com.shiptrack.graphql.client.ShipmentClient;
import com.shiptrack.graphql.client.TrackingClient;
import com.shiptrack.graphql.dto.ShipmentDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.graphql.test.tester.GraphQlTester;

import static org.mockito.Mockito.when;

@SpringBootTest(properties = {"eureka.client.enabled=false", "spring.cloud.config.enabled=false"})
@org.springframework.boot.test.autoconfigure.graphql.tester.AutoConfigureGraphQlTester
class ShipmentGraphQLControllerTest {

    @Autowired
    private GraphQlTester graphQlTester;

    @MockitoBean
    private ShipmentClient shipmentClient;
    @MockitoBean
    private TrackingClient trackingClient;
    @MockitoBean
    private QuoteClient quoteClient;
    @MockitoBean
    private CountryClient countryClient;

    @Test
    void shipmentQuery_returnsShipmentFromDownstreamService() {
        when(shipmentClient.getById(42L)).thenReturn(new ShipmentDto(42L, "ST-ABCD1234", "Alice", "1 Main St",
                "Bob", "2 Elm St", "US", "GB", 4.5, "CREATED", "2026-01-01T00:00:00Z"));

        graphQlTester.document("query { shipment(id: \"42\") { id trackingNumber status } }")
                .execute()
                .path("shipment.id").entity(String.class).isEqualTo("42")
                .path("shipment.trackingNumber").entity(String.class).isEqualTo("ST-ABCD1234")
                .path("shipment.status").entity(String.class).isEqualTo("CREATED");
    }
}
