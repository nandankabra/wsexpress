const { ApiError } = require('@shiptrack/common');
const pricingModel = require('../models/pricingModel');
const countryClient = require('../soap/countryClient');
const locationClient = require('../clients/locationClient');

const DEFAULT_PACKAGE_TYPE = 'PARCEL';
const FALLBACK_TRANSIT_DAYS = { domestic: 3, international: 7 };

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return round2(amount);
  const [from, to] = await Promise.all([pricingModel.findRate(fromCurrency), pricingModel.findRate(toCurrency)]);
  if (!from) throw ApiError.badRequest(`Unknown currency ${fromCurrency}`);
  if (!to) throw ApiError.badRequest(`Unknown currency ${toCurrency}`);
  const amountInUsd = amount * Number(from.rate_to_usd);
  return round2(amountInUsd / Number(to.rate_to_usd));
}

// Mock distance function for consistent km based on city string length
function mockDistance(cityA, cityB) {
  if (!cityA || !cityB || cityA.toUpperCase() === cityB.toUpperCase()) return 50;
  const hash = (cityA + cityB).split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
  return Math.abs(hash % 2000) + 100; // 100 to 2100 km
}

async function calculateQuote({ originCountry, destinationCountry, originCity, destinationCity, weightKg, dimensionsCm, packageType, serviceType, currency }, correlationId) {
  const type = packageType || DEFAULT_PACKAGE_TYPE;
  const srvType = serviceType || 'STANDARD';
  const rule = (await pricingModel.findRule(type)) || (await pricingModel.findRule(DEFAULT_PACKAGE_TYPE));
  if (!rule) throw ApiError.internal('No pricing rules configured');

  const isInternational = originCountry.toUpperCase() !== destinationCountry.toUpperCase();
  
  // 1. Calculate Chargeable Weight (Volumetric vs Actual)
  const volWeight = dimensionsCm ? (dimensionsCm.length * dimensionsCm.width * dimensionsCm.height) / 5000 : 0;
  const chargeableWeight = Math.max(weightKg, volWeight);

  // 2. Base & Weight Pricing
  let baseUsd = Number(rule.base_rate);
  let weightUsd = Number(rule.per_kg_rate) * chargeableWeight;
  
  // 3. Distance Pricing
  const distanceKm = mockDistance(originCity, destinationCity);
  let distanceUsd = distanceKm * 0.05; // 5 cents per km

  if (isInternational) {
    baseUsd *= Number(rule.international_multiplier);
    distanceUsd *= Number(rule.international_multiplier);
  }

  // 4. Service Type Multiplier
  let subTotalUsd = baseUsd + weightUsd + distanceUsd;
  if (srvType === 'EXPRESS') {
    subTotalUsd *= 1.5;
  }

  // 5. Tax (18%)
  const taxUsd = subTotalUsd * 0.18;
  const totalUsd = subTotalUsd + taxUsd;

  let destinationCurrency = 'USD';
  try {
    const countryInfo = await countryClient.getCountryInfo(destinationCountry);
    if (countryInfo) destinationCurrency = countryInfo.currency;
  } catch (err) {
    console.error(`[pricing-service] SOAP GetCountryInfo(${destinationCountry}) failed:`, err.message);
  }

  const targetCurrency = (currency || destinationCurrency || 'USD').toUpperCase();
  
  // Convert all breakdowns to target currency
  const baseFare = await convertCurrency(baseUsd, 'USD', targetCurrency);
  const distanceCharge = await convertCurrency(distanceUsd, 'USD', targetCurrency);
  const weightCharge = await convertCurrency(weightUsd, 'USD', targetCurrency);
  const taxAmount = await convertCurrency(taxUsd, 'USD', targetCurrency);
  const totalAmount = await convertCurrency(totalUsd, 'USD', targetCurrency);

  const route = await locationClient.getRoute(originCountry, destinationCountry, correlationId);
  const baseDays = route ? route.transitDays : (isInternational ? FALLBACK_TRANSIT_DAYS.international : FALLBACK_TRANSIT_DAYS.domestic);
  const estimatedDays = srvType === 'EXPRESS' ? Math.max(1, Math.floor(baseDays / 2)) : baseDays;

  return { 
    priceAmount: totalAmount, // backward compat
    baseFare,
    distanceCharge,
    weightCharge,
    taxAmount,
    totalAmount,
    currency: targetCurrency, 
    estimatedDays 
  };
}

function ruleResponse(row) {
  return {
    packageType: row.package_type,
    baseRate: Number(row.base_rate),
    perKgRate: Number(row.per_kg_rate),
    internationalMultiplier: Number(row.international_multiplier),
  };
}

async function listRules() {
  const rows = await pricingModel.listRules();
  return rows.map(ruleResponse);
}

async function upsertRule(body) {
  const row = await pricingModel.upsertRule(body);
  return ruleResponse(row);
}

module.exports = { calculateQuote, convertCurrency, listRules, upsertRule };
