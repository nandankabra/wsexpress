package com.shiptrack.tracking.repository;

import com.shiptrack.tracking.document.CarrierPayload;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CarrierPayloadRepository extends MongoRepository<CarrierPayload, String> {
}
