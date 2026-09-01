package com.shiptrack.tracking.repository;

import com.shiptrack.tracking.document.RequestAudit;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RequestAuditRepository extends MongoRepository<RequestAudit, String> {
}
