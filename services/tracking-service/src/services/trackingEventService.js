const { ApiError, paginate, decodeCursor } = require('@shiptrack/common');
const trackingEventModel = require('../models/trackingEventModel');

function toResponse(doc) {
  return {
    id: String(doc._id),
    trackingId: doc.trackingId,
    status: doc.status,
    location: doc.location || null,
    note: doc.note || null,
    recordedBy: doc.recordedBy || null,
    timestamp: doc.timestamp,
  };
}

async function recordEvent({ trackingId, status, location, note, recordedBy }) {
  const doc = await trackingEventModel.create({ trackingId, status, location, note, recordedBy });
  return toResponse(doc);
}

async function listEvents(trackingId, { cursor, limit = 20 }) {
  const after = decodeCursor(cursor);
  const docs = await trackingEventModel.listByTrackingId(trackingId, {
    limit,
    afterId: after ? after.id : null,
  });
  const result = paginate(docs, limit, (doc) => ({ id: String(doc._id) }));
  return { data: result.data.map(toResponse), pagination: result.pagination };
}

async function latestEvent(trackingId) {
  const doc = await trackingEventModel.findLatest(trackingId);
  if (!doc) throw ApiError.notFound(`No tracking events found for ${trackingId}`);
  return toResponse(doc);
}

module.exports = { recordEvent, listEvents, latestEvent, toResponse };
