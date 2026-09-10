const { createServiceClient } = require('@shiptrack/common');

const pricingClient = createServiceClient({
  baseURL: process.env.PRICING_SERVICE_URL,
  name: 'pricing-service',
});

function getQuote(data, correlationId) {
  return pricingClient.post(
    '/api/v1/pricing/quote',
    data,
    correlationId,
  );
}

module.exports = { getQuote };
