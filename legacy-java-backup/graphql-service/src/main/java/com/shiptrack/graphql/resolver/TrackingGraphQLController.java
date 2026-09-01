package com.shiptrack.graphql.resolver;

import com.shiptrack.graphql.client.TrackingClient;
import com.shiptrack.graphql.dto.CreateTrackingEventRequest;
import com.shiptrack.graphql.dto.TrackingEventDto;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class TrackingGraphQLController {

    private final TrackingClient trackingClient;

    @QueryMapping
    public List<TrackingEventDto> trackingEvents(@Argument Long shipmentId) {
        return trackingClient.historyForShipment(shipmentId);
    }

    @MutationMapping
    public TrackingEventDto createTrackingEvent(@Argument CreateTrackingEventRequest input) {
        return trackingClient.createEvent(input);
    }
}
