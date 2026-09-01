const analyticsEventModel = require('../models/analyticsEventModel');

async function recordEvent(body) {
  const doc = await analyticsEventModel.create(body);
  return { id: String(doc._id), eventType: doc.eventType, entityId: doc.entityId, timestamp: doc.timestamp };
}

async function getSummary() {
  const rows = await analyticsEventModel.countByEventType();
  const counts = Object.fromEntries(rows.map((row) => [row._id, row.count]));
  const shipmentsCreated = counts.SHIPMENT_CREATED || 0;
  const shipmentsDelivered = counts.SHIPMENT_DELIVERED || 0;
  return {
    counts,
    deliveryRate: shipmentsCreated > 0 ? Number((shipmentsDelivered / shipmentsCreated).toFixed(3)) : 0,
  };
}

async function getTopCustomers(limit = 10) {
  const rows = await analyticsEventModel.topCustomersByShipments(limit);
  return rows.map((row) => ({ customerId: row._id, shipmentCount: row.shipmentCount }));
}

async function getCarrierPerformance(limit = 10) {
  const rows = await analyticsEventModel.carrierDeliveryPerformance(limit);
  return rows.map((row) => ({ carrierId: row._id, deliveredCount: row.deliveredCount }));
}

module.exports = { recordEvent, getSummary, getTopCustomers, getCarrierPerformance };
