const { createServiceClient } = require('@shiptrack/common');

const crmClient = createServiceClient({
  baseURL: process.env.CRM_SERVICE_URL,
  name: 'crm-service',
  // Analytics ingestion is fire-and-forget: it must never block or fail registration just
  // because crm-service is briefly unavailable.
  fallback: () => null,
});

function recordEvent(eventType, { entityId, customerId, metadata }, correlationId) {
  return crmClient.post('/api/v1/crm/events', { eventType, entityId, customerId, metadata }, correlationId);
}

module.exports = { recordEvent };
