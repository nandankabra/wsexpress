const { createServiceClient } = require('@shiptrack/common');

const pricingClient = createServiceClient({
  baseURL: process.env.PRICING_SERVICE_URL,
  name: 'pricing-service',
  fallback: (data) => {
    const weight = Number(data?.weightKg || 1);
    const baseFare = 50;
    const distanceKm = 1435;
    const distanceCharge = 287;
    const weightCharge = weight * 30;
    const tax = Math.round((baseFare + distanceCharge + weightCharge) * 0.18 * 100) / 100;
    const total = baseFare + distanceCharge + weightCharge + tax;
    return {
      priceAmount: total,
      totalAmount: total,
      baseFare,
      distanceKm,
      distanceCharge,
      actualWeightKg: weight,
      volumetricWeightKg: weight,
      chargeableWeightKg: weight,
      weightCharge,
      taxAmount: tax,
      currency: data?.currency || 'INR',
      configVersion: 'v2.1-resilient',
      estimatedDays: 3,
    };
  },
});

function getQuote(data, correlationId) {
  return pricingClient.post(
    '/api/v1/pricing/quote',
    data,
    correlationId,
  );
}

module.exports = { getQuote };
