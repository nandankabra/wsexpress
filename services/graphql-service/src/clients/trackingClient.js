const { createServiceClient } = require('@shiptrack/common');

const client = createServiceClient({
  baseURL: process.env.TRACKING_SERVICE_URL,
  name: 'tracking-service',
});

function listEvents(trackingId, { limit = 20 } = {}, correlationId) {
  return client.get(`/api/v1/tracking/${trackingId}/events?limit=${limit}`, correlationId);
}

module.exports = { listEvents };
