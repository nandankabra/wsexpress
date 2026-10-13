const crypto = require('crypto');
const { ApiError, paginate, decodeCursor } = require('@shiptrack/common');
const shipmentModel = require('../models/shipmentModel');
const pricingClient = require('../clients/pricingClient');
const trackingClient = require('../clients/trackingClient');
const crmClient = require('../clients/crmClient');

const NEXT_STATUS = {
  CREATED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['ARRIVED_AT_HUB', 'CANCELLED'],
  ARRIVED_AT_HUB: ['IN_TRANSIT', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  IN_TRANSIT: ['ARRIVED_AT_HUB', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

// Manually allow ASSIGNED -> OUT_FOR_DELIVERY when picked up from destination hub
NEXT_STATUS['ASSIGNED'].push('OUT_FOR_DELIVERY');

function generateTrackingId() {
  return `STK${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

function toResponse(row) {
  return {
    id: row.id,
    orderNumber: row.order_number || `ORD-${row.tracking_id}`,
    trackingId: row.tracking_id,
    customerId: row.customer_id,
    carrierId: row.carrier_id,
    assignedDriverId: row.assigned_driver_id,
    currentHubId: row.current_hub_id,
    destinationHubId: row.destination_hub_id,
    origin: { address: row.origin_address, city: row.origin_city, country: row.origin_country },
    destination: { address: row.destination_address, city: row.destination_city, country: row.destination_country },
    distanceKm: Number(row.distance_km || 0),
    weightKg: Number(row.weight_kg),
    dimensionsCm: row.dimensions_cm,
    packageType: row.package_type,
    serviceType: row.service_type,
    status: row.status,
    orderStatus: row.order_status || 'CONFIRMED',
    paymentStatus: row.payment_status || 'PAID',
    quotedPrice: row.quoted_price === null ? null : Number(row.quoted_price),
    baseFare: row.base_fare === null ? null : Number(row.base_fare),
    distanceCharge: row.distance_charge === null ? null : Number(row.distance_charge),
    weightCharge: row.weight_charge === null ? null : Number(row.weight_charge),
    taxAmount: row.tax_amount === null ? null : Number(row.tax_amount),
    totalAmount: row.total_amount === null ? null : Number(row.total_amount),
    currency: row.currency,
    pricingBreakdown: typeof row.pricing_breakdown === 'string' ? JSON.parse(row.pricing_breakdown) : (row.pricing_breakdown || null),
    pricingVersion: row.pricing_version || 'v2.1',
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
    serviceType: row.service_type,
    estimatedDeliveryDate: row.estimated_delivery_date,
    actualDeliveryDate: row.actual_delivery_date,
    updatedAt: row.updated_at,
  };
}

function toPricingQuoteRequest(body) {
  return {
    originCountry: body.origin.country,
    destinationCountry: body.destination.country,
    originCity: body.origin.city,
    destinationCity: body.destination.city,
    weightKg: body.weightKg,
    dimensionsCm: body.dimensionsCm || { length: 10, width: 10, height: 10 },
    packageType: body.packageType || 'PARCEL',
    serviceType: body.serviceType || 'STANDARD',
    currency: body.currency,
  };
}

async function getQuote(body, correlationId) {
  const quote = await pricingClient.getQuote(toPricingQuoteRequest(body), correlationId);
  return quote;
}

async function createShipment(customerId, body, correlationId) {
  const quote = await pricingClient.getQuote(toPricingQuoteRequest(body), correlationId);

  const estimatedDeliveryDate = new Date(Date.now() + (quote.estimatedDays || 5) * 86_400_000)
    .toISOString()
    .slice(0, 10);

  // Auto-assign hub logic (mock routing for now)
  const currentHubId = `HUB_${body.origin.city.substring(0, 3).toUpperCase()}`;
  const destinationHubId = `HUB_${body.destination.city.substring(0, 3).toUpperCase()}`;

  const trackingId = generateTrackingId();
  const orderNumber = `ORD-${trackingId}`;

  const row = await shipmentModel.create({
    trackingId,
    orderNumber,
    customerId,
    originAddress: body.origin.address,
    originCity: body.origin.city,
    originCountry: body.origin.country,
    destinationAddress: body.destination.address,
    destinationCity: body.destination.city,
    destinationCountry: body.destination.country,
    weightKg: body.weightKg,
    dimensionsCm: body.dimensionsCm || { length: 10, width: 10, height: 10 },
    packageType: body.packageType || 'PARCEL',
    serviceType: body.serviceType || 'STANDARD',
    quotedPrice: quote.totalAmount || quote.priceAmount,
    baseFare: quote.baseFare || 0,
    distanceCharge: quote.distanceCharge || 0,
    weightCharge: quote.weightCharge || 0,
    taxAmount: quote.taxAmount || 0,
    totalAmount: quote.totalAmount || quote.priceAmount,
    currency: quote.currency,
    distanceKm: quote.distanceKm || 0,
    pricingBreakdown: quote,
    pricingVersion: quote.configVersion || 'v2.1',
    orderStatus: 'PENDING_PAYMENT',
    paymentStatus: 'AWAITING_PAYMENT',
    estimatedDeliveryDate,
    currentHubId,
    destinationHubId
  });

  await trackingClient.recordEvent(
    row.tracking_id,
    { status: 'CREATED', location: body.origin.city, note: 'Shipment created' },
    correlationId,
  );

  await crmClient.recordEvent(
    'SHIPMENT_CREATED',
    { entityId: row.id, customerId, metadata: { trackingId: row.tracking_id, orderNumber } },
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
  if (actor.role === 'ADMIN' || actor.role === 'HUB_STAFF') return;
  if (actor.role === 'CUSTOMER' && row.customer_id === actor.sub) return;
  
  if (actor.role === 'CARRIER') {
    // Carrier sees assigned shipments or unassigned ones.
    if (row.assigned_driver_id === actor.sub) return;
    if (!row.assigned_driver_id && (row.status === 'CREATED' || row.status === 'ARRIVED_AT_HUB')) return;
  }
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
  // Note: For carrierScope, shipmentModel.listPage needs to be updated to handle `assigned_driver_id`

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

  // Update logic: OCC handles race conditions here.
  // If transitioning to ASSIGNED, we set assigned_driver_id
  let driverId = undefined;
  if (status === 'ASSIGNED' && actor.role === 'CARRIER') {
    if (existing.assigned_driver_id && existing.assigned_driver_id !== actor.sub) {
      throw ApiError.preconditionFailed('Already claimed by another driver');
    }
    driverId = actor.sub;
  }

  // Wait, I need to update shipmentModel.updateStatus to support assigned_driver_id
  // We'll pass driverId as carrierId for backwards compatibility in the model for a moment
  const updated = await shipmentModel.updateStatus(id, { 
    status, 
    expectedVersion, 
    assignedDriverId: driverId 
  });
  
  if (!updated) {
    throw ApiError.preconditionFailed('Shipment was modified by someone else, refresh and retry');
  }

  await trackingClient.recordEvent(
    updated.tracking_id,
    { status, location: updated.destination_city, note: `Status updated to ${status}` },
    correlationId,
  );

  if (status === 'DELIVERED' || status === 'CANCELLED') {
    await crmClient.recordEvent(
      status === 'DELIVERED' ? 'SHIPMENT_DELIVERED' : 'SHIPMENT_CANCELLED',
      { entityId: updated.id, customerId: updated.customer_id, carrierId: updated.assigned_driver_id || updated.carrier_id, metadata: { trackingId: updated.tracking_id } },
      correlationId,
    );
  }

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

async function listOrdersAdmin(actor, filters) {
  if (actor.role !== 'ADMIN') {
    throw ApiError.forbidden('Admin access required');
  }
  const result = await shipmentModel.listOrdersAdmin(filters);
  return {
    data: result.rows.map(toResponse),
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
    summary: result.summary,
  };
}

async function performAdminOrderAction(id, actor, { action, payload = {} }, correlationId) {
  if (actor.role !== 'ADMIN') {
    throw ApiError.forbidden('Admin access required');
  }
  const existing = await shipmentModel.findById(id);
  if (!existing) throw ApiError.notFound('Order not found');

  if (action === 'CONFIRM_ORDER') {
    const updated = await shipmentModel.updatePaymentStatus(id, {
      paymentStatus: existing.payment_status,
      orderStatus: 'CONFIRMED',
    });
    return toResponse(updated);
  } else if (action === 'CANCEL_ORDER') {
    await shipmentModel.updateStatus(id, {
      status: 'CANCELLED',
      expectedVersion: existing.version,
    });
    const updated = await shipmentModel.updatePaymentStatus(id, {
      paymentStatus: existing.payment_status === 'PAID' ? 'REFUNDED' : 'FAILED',
      orderStatus: 'CANCELLED',
    });
    return toResponse({ ...updated, status: 'CANCELLED' });
  } else if (action === 'ASSIGN_CARRIER') {
    if (!payload.carrierId) throw ApiError.badRequest('carrierId is required');
    const updated = await assignCarrier(id, payload.carrierId, existing.version);
    return updated;
  } else if (action === 'UPDATE_STATUS') {
    if (!payload.status) throw ApiError.badRequest('status is required');
    const updated = await updateStatus(id, actor, {
      status: payload.status,
      expectedVersion: existing.version,
    }, correlationId);
    return updated;
  } else {
    throw ApiError.badRequest(`Unknown admin action ${action}`);
  }
}

module.exports = {
  getQuote,
  createShipment,
  getShipmentForActor,
  trackPublic,
  listShipments,
  listOrdersAdmin,
  performAdminOrderAction,
  updateStatus,
  assignCarrier,
  updateDelivery,
  toResponse,
};

