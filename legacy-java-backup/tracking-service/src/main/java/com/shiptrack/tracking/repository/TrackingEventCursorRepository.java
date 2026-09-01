package com.shiptrack.tracking.repository;

import com.shiptrack.tracking.document.TrackingEvent;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Cursor pagination over tracking_events ordered newest-first. MongoDB ObjectId values are
 * time-ordered and monotonically increasing per node, so paging on "_id less than the last id
 * seen" is a stable, index-friendly cursor that doesn't skip or repeat rows even if new events
 * are inserted between page requests (unlike offset/limit pagination).
 */
@Repository
@RequiredArgsConstructor
public class TrackingEventCursorRepository {

    private final MongoTemplate mongoTemplate;

    public List<TrackingEvent> findPage(String cursor, int limit) {
        Query query = new Query().limit(limit).with(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "_id"));
        if (cursor != null && !cursor.isBlank() && ObjectId.isValid(cursor)) {
            query.addCriteria(Criteria.where("_id").lt(new ObjectId(cursor)));
        }
        return mongoTemplate.find(query, TrackingEvent.class);
    }
}
