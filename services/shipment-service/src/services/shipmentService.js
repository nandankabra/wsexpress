const crypto = require('crypto');
const { ApiError, paginate, decodeCursor } = require('@shiptrack/common');
const shipmentModel = require('../models/shipmentModel');
const pricingClient = require('../clients/pricingClient');
const trackingClient = require('../clients/trackingClient');

const NEXT_STATUS = {
  CREATED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

function generateTrackingId() {
  return `STK${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

function toResponse(row) {
  return {
    id: row.id,
    trackingId: row.tracking_id,
    customerId: row.customer_id,
    carrierId: row.carrier_id,
    origin: { address: row.origin_address, city: row.origin_city, country: row.origin_country },
    destination: { address: row.destination_address, city: row.destination_city, country: row.destination_country },
    weightKg: Number(row.weight_kg),
    packageType: row.package_type,
    status: row.status,
    quotedPrice: row.quoted_price === null ? null : Number(row.quoted_price),
    currency: row.currency,
    estimatedDeliveryDate: row.estimated_delivery_date,
    actualDeliveryDate: row.actual_delivery_date,
    deliveryNotes: row.delivery_notes,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPublicTrackingResponse(row) {
  return {
    trackingId: row.tracking_id,
    status: row.status,
    originCity: row.origin_city,
    originCountry: row.origin_country,
    destinationCity: row.destination_city,
    destinationCountry: row.destination_country,
    estimatedDeliveryDate: row.estimated_delivery_date,
    actualDeliveryDate: row.actual_delivery_date,
    updatedAt: row.updated_at,
  };
}

async function getQuote(body, correlationId) {
  const quote = await pricingClient.getQuote(body, correlationId);
  return quote;
}

async function createShipment(customerId, body, correlationId) {
  const quote = await pricingClient.getQuote(
    {
      originCountry: body.origin.country,
      destinationCountry: body.destination.country,
      weightKg: body.weightKg,
      packageType: body.packageType || 'PARCEL',
      currency: body.currency,
    },
    correlationId,
  );

  const estimatedDeliveryDate = new Date(Date.now() + (quote.estimatedDays || 5) * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const row = await shipmentModel.create({
    trackingId: generateTrackingId(),
    customerId,
    originAddress: body.origin.address,
    originCity: body.origin.city,
    originCountry: body.origin.country,
    destinationAddress: body.destination.address,
    destinationCity: body.destination.city,
    destinationCountry: body.destination.country,
    weightKg: body.weightKg,
    packageType: body.packageType || 'PARCEL',
    quotedPrice: quote.priceAmount,
    currency: quote.currency,
    estimatedDeliveryDate,
  });

  await trackingClient.recordEvent(
    row.tracking_id,
    { status: 'CREATED', location: body.origin.city, note: 'Shipment created' },
    correlationId,
  );

  return toResponse(row);
}

async function getShipmentForActor(id, actor) {
  const row = await shipmentModel.findById(id);
  if (!row) throw ApiError.notFound('Shipment not found');
  assertCanView(row, actor);
  return toResponse(row);
}

function assertCanView(row, actor) {
  if (actor.role === 'ADMIN') return;
  if (actor.role === 'CUSTOMER' && row.customer_id === actor.sub) return;
  // A carrier can see/act on shipments already assigned to them, or unassigned ones
  // available to claim (the first carrier to update status on one is auto-assigned).
  if (actor.role === 'CARRIER' && (row.carrier_id === actor.sub || row.carrier_id === null)) return;
  throw ApiError.forbidden('You do not have access to this shipment');
}

async function trackPublic(trackingId) {
  const row = await shipmentModel.findByTrackingId(trackingId);
  if (!row) throw ApiError.notFound('No shipment found for this tracking ID');
  return toPublicTrackingResponse(row);
}

async function listShipments(actor, { cursor, limit = 20, status }) {
  const after = decodeCursor(cursor);
  const filters = { limit, afterId: after ? after.id : null, status };
  if (actor.role === 'CUSTOMER') filters.customerId = actor.sub;
  if (actor.role === 'CARRIER') filters.carrierScope = actor.sub;

  const rows = await shipmentModel.listPage(filters);
  const result = paginate(rows, limit, (row) => ({ id: row.id }));
  return { data: result.data.map(toResponse), pagination: result.pagination };
}

async function updateStatus(id, actor, { status, expectedVersion }, correlationId) {
  const existing = await shipmentModel.findById(id);
  if (!existing) throw ApiError.notFound('Shipment not found');
  assertCanView(existing, actor);

  if (!NEXT_STATUS[existing.status]?.includes(status)) {
    throw ApiError.unprocessable(`Cannot transition shipment from ${existing.status} to ${status}`);
  }

  const carrierId = actor.role === 'CARRIER' && !existing.carrier_id ? actor.sub : undefined;
  const updated = await shipmentModel.updateStatus(id, { status, expectedVersion, carrierId });
  if (!updated) {
    throw ApiError.preconditionFailed('Shipment was modified by someone else, refresh and retry');
  }

  await trackingClient.recordEvent(
    updated.tracking_id,
    { status, location: updated.destination_city, note: `Status updated to ${status}` },
    correlationId,
  );

  return toResponse(updated);
}

async function assignCarrier(id, carrierId, expectedVersion) {
  const updated = await shipmentModel.assignCarrier(id, carrierId, expectedVersion);
  if (!updated) {
    const existing = await shipmentModel.findById(id);
    if (!existing) throw ApiError.notFound('Shipment not found');
    throw ApiError.preconditionFailed('Shipment was modified by someone else, refresh and retry');
  }
  return toResponse(updated);
}

async function updateDelivery(id, actor, body) {
  const existing = await shipmentModel.findById(id);
  if (!existing) throw ApiError.notFound('Shipment not found');
  assertCanView(existing, actor);

  const updated = await shipmentModel.updateDelivery(id, {
    actualDeliveryDate: body.actualDeliveryDate,
    deliveryNotes: body.deliveryNotes,
    expectedVersion: body.expectedVersion,
  });
  if (!updated) {
    throw ApiError.preconditionFailed('Shipment was modified by someone else, refresh and retry');
  }
  return toResponse(updated);
}

module.exports = {
  getQuote,
  createShipment,
  getShipmentForActor,
  trackPublic,
  listShipments,
  updateStatus,
  assignCarrier,
  updateDelivery,
  toResponse,
};
