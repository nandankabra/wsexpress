const { createServiceClient } = require('@shiptrack/common');

const trackingClient = createServiceClient({
  baseURL: process.env.TRACKING_SERVICE_URL,
  name: 'tracking-service',
  // Recording a tracking event is best-effort from the shipment status update's point of
  // view: if tracking-service is down, the status change still succeeds locally rather than
  // failing the whole request. The circuit breaker's fallback returns null instead of throwing.
  fallback: () => null,
});

function recordEvent(trackingId, { status, location, note }, correlationId) {
  return trackingClient.post(
    `/api/v1/tracking/${trackingId}/events`,
    { status, location, note },
    correlationId,
  );
}

module.exports = { recordEvent };
