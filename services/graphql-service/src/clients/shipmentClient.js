const { createServiceClient } = require('@shiptrack/common');

const client = createServiceClient({
  baseURL: process.env.SHIPMENT_SERVICE_URL,
  name: 'shipment-service',
});

function authConfig(token) {
  return token ? { headers: { Authorization: token } } : {};
}

function getById(id, token, correlationId) {
  return client.get(`/api/v1/shipments/${id}`, correlationId, authConfig(token));
}

function trackPublic(trackingId, correlationId) {
  return client.get(`/api/v1/shipments/track/${trackingId}`, correlationId);
}

function listMine(token, { limit = 20, cursor } = {}, correlationId) {
  const params = new URLSearchParams({ limit: String(limit), ...(cursor ? { cursor } : {}) });
  return client.get(`/api/v1/shipments?${params.toString()}`, correlationId, authConfig(token));
}

module.exports = { getById, trackPublic, listMine };
