const pricingService = require('../services/pricingService');

async function quote(req, res, next) {
  try {
    const body = { ...req.body };
    if (!body.originCountry) body.originCountry = 'IN';
    if (!body.destinationCountry) body.destinationCountry = 'IN';
    if (!body.originCity && body.origin) body.originCity = body.origin;
    if (!body.destinationCity && body.destination) body.destinationCity = body.destination;
    if (body.weightKg === undefined && body.weight !== undefined) body.weightKg = body.weight;
    if (!body.dimensionsCm && body.dimensions) body.dimensionsCm = body.dimensions;
    res.status(200).json(await pricingService.calculateQuote(body, req.correlationId));
  } catch (err) {
    next(err);
  }
}

async function convert(req, res, next) {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;
    const convertedAmount = await pricingService.convertCurrency(
      amount,
      fromCurrency.toUpperCase(),
      toCurrency.toUpperCase(),
    );
    res.status(200).json({ convertedAmount, fromCurrency, toCurrency });
  } catch (err) {
    next(err);
  }
}

async function listRules(req, res, next) {
  try {
    res.status(200).json(await pricingService.listRules());
  } catch (err) {
    next(err);
  }
}

async function upsertRule(req, res, next) {
  try {
    res.status(200).json(await pricingService.upsertRule(req.body));
  } catch (err) {
    next(err);
  }
}

async function getConfig(req, res, next) {
  try {
    res.status(200).json(pricingService.getActiveConfig());
  } catch (err) {
    next(err);
  }
}

async function updateConfig(req, res, next) {
  try {
    const adminUser = req.user?.email || 'admin';
    const result = pricingService.updateActiveConfig(req.body, adminUser);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { quote, convert, listRules, upsertRule, getConfig, updateConfig };
