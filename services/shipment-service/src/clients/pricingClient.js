const { createServiceClient } = require('@shiptrack/common');

const pricingClient = createServiceClient({
  baseURL: process.env.PRICING_SERVICE_URL,
  name: 'pricing-service',
});

function getQuote({ originCountry, destinationCountry, weightKg, packageType, currency }, correlationId) {
  return pricingClient.post(
    '/api/v1/pricing/quote',
    { originCountry, destinationCountry, weightKg, packageType, currency },
    correlationId,
  );
}

module.exports = { getQuote };
