const { createServiceClient } = require('@shiptrack/common');

const crmClient = createServiceClient({
  baseURL: process.env.CRM_SERVICE_URL,
  name: 'crm-service',
  // Analytics ingestion is fire-and-forget from the caller's point of view: it must never
  // block or fail a shipment operation just because crm-service is briefly unavailable.
  fallback: () => null,
});

function recordEvent(eventType, { entityId, customerId, carrierId, metadata }, correlationId) {
  return crmClient.post('/api/v1/crm/events', { eventType, entityId, customerId, carrierId, metadata }, correlationId);
}

module.exports = { recordEvent };
