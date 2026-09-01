const { createServiceClient } = require('@shiptrack/common');

const locationClient = createServiceClient({
  baseURL: process.env.LOCATION_SERVICE_URL,
  name: 'location-service',
  // Transit-day lookup is an enhancement, not a hard requirement for pricing a quote;
  // fall back to null so the caller can apply a sensible default estimate instead.
  fallback: () => null,
});

function getRoute(originCountry, destinationCountry, correlationId) {
  return locationClient.get(
    `/api/v1/locations/routes/lookup?origin=${originCountry}&destination=${destinationCountry}`,
    correlationId,
  );
}

module.exports = { getRoute };
