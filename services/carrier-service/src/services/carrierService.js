const { ApiError, paginate, decodeCursor } = require('@shiptrack/common');
const carrierModel = require('../models/carrierModel');
const crmClient = require('../clients/crmClient');

function toResponse(row) {
  return {
    userId: row.user_id,
    companyName: row.company_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    vehicleType: row.vehicle_type,
    licenseNumber: row.license_number,
    serviceAreas: row.service_areas,
    isVerified: row.is_verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function upsertCarrier(userId, data) {
  const row = await carrierModel.upsert(userId, data);
  return toResponse(row);
}

async function createCarrierProfile(data) {
  const row = await carrierModel.upsert(data.userId, data);
  return toResponse(row);
}

async function getCarrier(userId) {
  const row = await carrierModel.findByUserId(userId);
  if (!row) throw ApiError.notFound('Carrier profile not found');
  return toResponse(row);
}

async function verifyCarrier(userId, isVerified, correlationId) {
  const row = await carrierModel.setVerified(userId, isVerified);
  if (!row) throw ApiError.notFound('Carrier profile not found');

  if (isVerified) {
    await crmClient.recordEvent('CARRIER_VERIFIED', { entityId: userId, carrierId: userId }, correlationId);
  }

  return toResponse(row);
}

async function listCarriers({ cursor, limit = 20, email }) {
  const after = decodeCursor(cursor);
  const rows = await carrierModel.listPage({ limit, afterUserId: after ? after.userId : null, email });
  const result = paginate(rows, limit, (row) => ({ userId: row.user_id }));
  return { data: result.data.map(toResponse), pagination: result.pagination };
}

module.exports = { upsertCarrier, createCarrierProfile, getCarrier, verifyCarrier, listCarriers, toResponse };
