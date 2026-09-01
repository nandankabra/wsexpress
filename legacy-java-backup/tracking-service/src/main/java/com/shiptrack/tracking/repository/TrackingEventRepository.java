package com.shiptrack.tracking.repository;

import com.shiptrack.tracking.document.TrackingEvent;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TrackingEventRepository extends MongoRepository<TrackingEvent, String> {

    List<TrackingEvent> findByShipmentIdOrderByOccurredAtDesc(Long shipmentId);
}
