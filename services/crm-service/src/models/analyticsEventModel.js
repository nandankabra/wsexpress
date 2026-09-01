const { mongoose } = require('../db/connection');
const { EVENT_TYPES } = require('./eventTypes');

const analyticsEventSchema = new mongoose.Schema({
  eventType: { type: String, required: true, enum: EVENT_TYPES, index: true },
  entityId: { type: String, required: true },
  customerId: { type: String, index: true },
  carrierId: { type: String, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
});

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);

async function create(data) {
  const doc = await AnalyticsEvent.create(data);
  return doc.toObject();
}

async function countByEventType() {
  return AnalyticsEvent.aggregate([{ $group: { _id: '$eventType', count: { $sum: 1 } } }]);
}

async function topCustomersByShipments(limit) {
  return AnalyticsEvent.aggregate([
    { $match: { eventType: 'SHIPMENT_CREATED', customerId: { $ne: null } } },
    { $group: { _id: '$customerId', shipmentCount: { $sum: 1 } } },
    { $sort: { shipmentCount: -1 } },
    { $limit: limit },
  ]);
}

async function carrierDeliveryPerformance(limit) {
  return AnalyticsEvent.aggregate([
    { $match: { eventType: 'SHIPMENT_DELIVERED', carrierId: { $ne: null } } },
    { $group: { _id: '$carrierId', deliveredCount: { $sum: 1 } } },
    { $sort: { deliveredCount: -1 } },
    { $limit: limit },
  ]);
}

module.exports = { AnalyticsEvent, create, countByEventType, topCustomersByShipments, carrierDeliveryPerformance };
