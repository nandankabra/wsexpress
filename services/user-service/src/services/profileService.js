const { ApiError, paginate, decodeCursor } = require('@shiptrack/common');
const profileModel = require('../models/profileModel');

function toResponse(row) {
  return {
    userId: row.user_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function upsertProfile(userId, data) {
  const row = await profileModel.upsert(userId, data);
  return toResponse(row);
}

async function getProfile(userId) {
  const row = await profileModel.findByUserId(userId);
  if (!row) throw ApiError.notFound('Customer profile not found');
  return toResponse(row);
}

async function listProfiles({ cursor, limit = 20 }) {
  const after = decodeCursor(cursor);
  const rows = await profileModel.listPage({ limit, afterUserId: after ? after.userId : null });
  const result = paginate(rows, limit, (row) => ({ userId: row.user_id }));
  return { data: result.data.map(toResponse), pagination: result.pagination };
}

module.exports = { upsertProfile, getProfile, listProfiles, toResponse };
