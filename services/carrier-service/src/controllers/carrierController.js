const carrierService = require('../services/carrierService');

async function getMe(req, res, next) {
  try {
    res.status(200).json(await carrierService.getCarrier(req.user.sub));
  } catch (err) {
    next(err);
  }
}

async function putMe(req, res, next) {
  try {
    res.status(200).json(await carrierService.upsertCarrier(req.user.sub, req.body));
  } catch (err) {
    next(err);
  }
}

async function createProfile(req, res, next) {
  try {
    res.status(201).json(await carrierService.createCarrierProfile(req.body));
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    res.status(200).json(await carrierService.getCarrier(req.params.userId));
  } catch (err) {
    next(err);
  }
}

async function verify(req, res, next) {
  try {
    res.status(200).json(await carrierService.verifyCarrier(req.params.userId, req.body.isVerified, req.correlationId));
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    res.status(200).json(await carrierService.listCarriers({ cursor: req.query.cursor, limit, email: req.query.email }));
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, putMe, createProfile, getById, verify, list };
