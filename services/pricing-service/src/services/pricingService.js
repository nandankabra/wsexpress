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

async function calculateQuote({ originCountry, destinationCountry, weightKg, packageType, currency }, correlationId) {
  const type = packageType || DEFAULT_PACKAGE_TYPE;
  const rule = (await pricingModel.findRule(type)) || (await pricingModel.findRule(DEFAULT_PACKAGE_TYPE));
  if (!rule) throw ApiError.internal('No pricing rules configured');

  const isInternational = originCountry.toUpperCase() !== destinationCountry.toUpperCase();
  let priceUsd = Number(rule.base_rate) + Number(rule.per_kg_rate) * weightKg;
  if (isInternational) priceUsd *= Number(rule.international_multiplier);

  // Real SOAP request to location-service's CountryInfoService (reads its WSDL, then calls
  // GetCountryInfo) to validate the destination country and pick its local currency when the
  // caller didn't request a specific one. Degrades to USD if the SOAP call fails.
  let destinationCurrency = 'USD';
  try {
    const countryInfo = await countryClient.getCountryInfo(destinationCountry);
    if (countryInfo) destinationCurrency = countryInfo.currency;
  } catch (err) {
    // location-service SOAP endpoint unavailable - degrade gracefully to USD pricing
  }

  const targetCurrency = (currency || destinationCurrency || 'USD').toUpperCase();
  const priceAmount = await convertCurrency(priceUsd, 'USD', targetCurrency);

  const route = await locationClient.getRoute(originCountry, destinationCountry, correlationId);
  const estimatedDays = route
    ? route.transitDays
    : (isInternational ? FALLBACK_TRANSIT_DAYS.international : FALLBACK_TRANSIT_DAYS.domestic);

  return { priceAmount, currency: targetCurrency, estimatedDays };
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
