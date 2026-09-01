const analyticsService = require('../services/analyticsService');

async function recordEvent(req, res, next) {
  try {
    res.status(201).json(await analyticsService.recordEvent(req.body));
  } catch (err) {
    next(err);
  }
}

async function summary(req, res, next) {
  try {
    res.status(200).json(await analyticsService.getSummary());
  } catch (err) {
    next(err);
  }
}

async function topCustomers(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    res.status(200).json(await analyticsService.getTopCustomers(limit));
  } catch (err) {
    next(err);
  }
}

async function carrierPerformance(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    res.status(200).json(await analyticsService.getCarrierPerformance(limit));
  } catch (err) {
    next(err);
  }
}

module.exports = { recordEvent, summary, topCustomers, carrierPerformance };
