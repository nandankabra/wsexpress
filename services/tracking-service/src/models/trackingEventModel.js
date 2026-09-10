const { mongoose } = require('../db/connection');

const trackingEventSchema = new mongoose.Schema({
  trackingId: { type: String, required: true, index: true },
  status: {
    type: String,
    required: true,
    enum: ['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  },
  location: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  note: { type: String },
  recordedBy: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const TrackingEvent = mongoose.model('TrackingEvent', trackingEventSchema);

async function create({ trackingId, status, location, lat, lng, note, recordedBy }) {
  const doc = await TrackingEvent.create({ trackingId, status, location, lat, lng, note, recordedBy });
  return doc.toObject();
}

async function listByTrackingId(trackingId, { limit, afterId } = {}) {
  const query = { trackingId };
  if (afterId) query._id = { $gt: afterId };
  const docs = await TrackingEvent.find(query)
    .sort({ _id: 1 })
    .limit(limit + 1)
    .lean();
  return docs;
}

async function findLatest(trackingId) {
  const doc = await TrackingEvent.findOne({ trackingId }).sort({ timestamp: -1 }).lean();
  return doc;
}

module.exports = { TrackingEvent, create, listByTrackingId, findLatest };
