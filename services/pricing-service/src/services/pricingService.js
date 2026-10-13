const { ApiError } = require('@shiptrack/common');
const pricingModel = require('../models/pricingModel');
const countryClient = require('../soap/countryClient');
const locationClient = require('../clients/locationClient');
const { calculateDistance } = require('./distanceService');

const DEFAULT_PACKAGE_TYPE = 'PARCEL';
const FALLBACK_TRANSIT_DAYS = { domestic: 3, international: 7 };

// Authoritative default rate card (configured in INR for intercity domestic freight)
let activeConfig = {
  configVersion: 'v2.1',
  baseHandlingFare: 50.00,       // ₹50 base handling fee
  distanceRatePerKm: 0.20,        // ₹0.20 per km (~₹200 for 1,000 km)
  weightRatePerKg: 30.00,         // ₹30 per kg (~₹30 for 1 kg)
  expressMultiplier: 1.40,        // 1.4x for Express speed
  taxRate: 0.18,                  // 18% GST / VAT
  fuelSurchargePercent: 0.05,     // 5% dynamic fuel surcharge
  minimumCharge: 80.00,           // ₹80 minimum order floor
  maximumCharge: 50000.00,        // ₹50,000 order safety cap
  baseCurrency: 'INR',
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

function round2(n) {
  return Math.round(n * 100) / 100;
}

const DEFAULT_RATES = {
  USD: 1.0,
  INR: 0.012,
  EUR: 1.08,
  GBP: 1.27,
  CAD: 0.73,
  AUD: 0.66,
  JPY: 0.0067,
};

async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return round2(amount);
  let from = null;
  let to = null;
  try {
    [from, to] = await Promise.all([
      pricingModel.findRate(fromCurrency),
      pricingModel.findRate(toCurrency),
    ]);
  } catch (e) {
    // ignore lookup error and fallback
  }
  const fromRate = from?.rate_to_usd ? Number(from.rate_to_usd) : DEFAULT_RATES[fromCurrency];
  const toRate = to?.rate_to_usd ? Number(to.rate_to_usd) : DEFAULT_RATES[toCurrency];

  if (!fromRate) throw ApiError.badRequest(`Unknown currency ${fromCurrency}`);
  if (!toRate) throw ApiError.badRequest(`Unknown currency ${toCurrency}`);
  const amountInUsd = amount * fromRate;
  return round2(amountInUsd / toRate);
}

async function calculateQuote({
  originCountry = 'IN',
  destinationCountry = 'IN',
  originCity = 'New Delhi',
  destinationCity = 'Mumbai',
  weightKg = 1,
  dimensionsCm,
  packageType = DEFAULT_PACKAGE_TYPE,
  serviceType = 'STANDARD',
  currency,
}, correlationId) {
  const normOriginCountry = (originCountry || 'IN').toUpperCase();
  const normDestCountry = (destinationCountry || 'IN').toUpperCase();
  const isInternational = normOriginCountry !== normDestCountry;
  const srvType = (serviceType || 'STANDARD').toUpperCase();
  const pkgType = (packageType || DEFAULT_PACKAGE_TYPE).toUpperCase();

  // 1. Authoritative Distance Calculation (Geodesic with Road Circuity Multiplier)
  const distanceInfo = calculateDistance(originCity, destinationCity);
  const distanceKm = distanceInfo.distanceKm;

  // 2. Weight and Volumetric Dimensional Weight Calculation
  // IATA Standard divisor: 5000 cm³/kg
  const actualWeight = Math.max(0.1, Number(weightKg) || 1);
  let volumetricWeight = 0;
  if (dimensionsCm && dimensionsCm.length && dimensionsCm.width && dimensionsCm.height) {
    volumetricWeight = round2((dimensionsCm.length * dimensionsCm.width * dimensionsCm.height) / 5000);
  }
  const chargeableWeight = round2(Math.max(actualWeight, volumetricWeight));

  // 3. Formula Components in Base Currency (INR)
  // Base Fare
  let baseFareInr = activeConfig.baseHandlingFare;

  // Package type multiplier if specialized
  if (pkgType === 'DOCUMENT') {
    baseFareInr = Math.max(40, baseFareInr * 0.75);
  } else if (pkgType === 'PALLET' || pkgType === 'FREIGHT') {
    baseFareInr = baseFareInr * 2.5;
  }

  // Distance Charge
  const distanceChargeInr = round2(distanceKm * activeConfig.distanceRatePerKm);

  // Weight Charge
  const weightChargeInr = round2(chargeableWeight * activeConfig.weightRatePerKg);

  // International Multiplier if cross-border
  let corridorMultiplier = 1.0;
  if (isInternational) {
    corridorMultiplier = 3.5;
  }

  // Subtotal before service multipliers
  let baseSubtotal = (baseFareInr + distanceChargeInr + weightChargeInr) * corridorMultiplier;

  // Service Type Multiplier (Express vs Standard)
  let serviceSurchargeInr = 0;
  if (srvType === 'EXPRESS') {
    const expressCost = baseSubtotal * activeConfig.expressMultiplier;
    serviceSurchargeInr = round2(expressCost - baseSubtotal);
    baseSubtotal = expressCost;
  }

  // Fuel Surcharge
  const fuelSurchargeInr = round2(baseSubtotal * activeConfig.fuelSurchargePercent);

  // Subtotal with fuel
  const taxableSubtotal = round2(baseSubtotal + fuelSurchargeInr);

  // Taxes (GST 18%)
  const taxAmountInr = round2(taxableSubtotal * activeConfig.taxRate);

  // Total in INR
  let totalInr = round2(taxableSubtotal + taxAmountInr);

  // Apply floor and cap constraints
  totalInr = Math.max(activeConfig.minimumCharge, Math.min(activeConfig.maximumCharge, totalInr));

  // 4. Currency Determination & Conversion
  let destinationCurrency = isInternational ? 'USD' : 'INR';
  try {
    const countryInfo = await countryClient.getCountryInfo(normDestCountry);
    if (countryInfo && countryInfo.currency) {
      destinationCurrency = countryInfo.currency;
    }
  } catch (err) {
    // Graceful fallback to default currency
  }

  const targetCurrency = (currency || destinationCurrency || 'INR').toUpperCase();

  // Convert breakdown items to target currency
  const baseFare = await convertCurrency(baseFareInr, 'INR', targetCurrency);
  const distanceCharge = await convertCurrency(distanceChargeInr, 'INR', targetCurrency);
  const weightCharge = await convertCurrency(weightChargeInr, 'INR', targetCurrency);
  const serviceSurcharge = await convertCurrency(serviceSurchargeInr, 'INR', targetCurrency);
  const fuelSurcharge = await convertCurrency(fuelSurchargeInr, 'INR', targetCurrency);
  const taxAmount = await convertCurrency(taxAmountInr, 'INR', targetCurrency);
  const totalAmount = await convertCurrency(totalInr, 'INR', targetCurrency);

  // 5. Transit Days
  const route = await locationClient.getRoute(normOriginCountry, normDestCountry, correlationId);
  const baseDays = route ? route.transitDays : (isInternational ? FALLBACK_TRANSIT_DAYS.international : FALLBACK_TRANSIT_DAYS.domestic);
  const estimatedDays = srvType === 'EXPRESS' ? Math.max(1, Math.floor(baseDays / 2)) : baseDays;

  return {
    priceAmount: totalAmount, // backward compatibility
    baseFare,
    distanceKm,
    distanceCharge,
    actualWeightKg: round2(actualWeight),
    volumetricWeightKg: round2(volumetricWeight),
    chargeableWeightKg: chargeableWeight,
    weightCharge,
    serviceType: srvType,
    serviceSurcharge,
    fuelSurcharge,
    taxAmount,
    totalAmount,
    currency: targetCurrency,
    configVersion: activeConfig.configVersion,
    estimatedDays,
    breakdownExplanation: {
      formula: 'Final Price = Base Fare + Distance Charge + Weight Charge + Service Surcharge + Fuel Surcharge + Tax',
      distanceProvider: distanceInfo.provider,
    },
  };
}

function getActiveConfig() {
  return { ...activeConfig };
}

function updateActiveConfig(updates, updatedBy = 'admin') {
  const allowedKeys = [
    'baseHandlingFare',
    'distanceRatePerKm',
    'weightRatePerKg',
    'expressMultiplier',
    'taxRate',
    'fuelSurchargePercent',
    'minimumCharge',
    'maximumCharge',
  ];

  const previous = { ...activeConfig };
  for (const key of allowedKeys) {
    if (updates[key] !== undefined && typeof updates[key] === 'number') {
      activeConfig[key] = updates[key];
    }
  }

  // Increment version tag
  const verParts = (activeConfig.configVersion || 'v2.1').replace('v', '').split('.').map(Number);
  verParts[1] = (verParts[1] || 0) + 1;
  activeConfig.configVersion = `v${verParts[0]}.${verParts[1]}`;
  activeConfig.updatedAt = new Date().toISOString();
  activeConfig.updatedBy = updatedBy;

  return {
    previousConfig: previous,
    updatedConfig: { ...activeConfig },
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

module.exports = {
  calculateQuote,
  convertCurrency,
  listRules,
  upsertRule,
  getActiveConfig,
  updateActiveConfig,
};
