const shipmentService = require('../services/shipmentService');

async function quote(req, res, next) {
  try {
    res.status(200).json(await shipmentService.getQuote(req.body, req.correlationId));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const shipment = await shipmentService.createShipment(req.user.sub, req.body, req.correlationId);
    res.status(201).json(shipment);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    res.status(200).json(await shipmentService.getShipmentForActor(req.params.id, req.user));
  } catch (err) {
    next(err);
  }
}

async function trackPublic(req, res, next) {
  try {
    res.status(200).json(await shipmentService.trackPublic(req.params.trackingId));
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const result = await shipmentService.listShipments(req.user, {
      cursor: req.query.cursor,
      limit,
      status: req.query.status,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const shipment = await shipmentService.updateStatus(req.params.id, req.user, req.body, req.correlationId);
    res.status(200).json(shipment);
  } catch (err) {
    next(err);
  }
}

async function assignCarrier(req, res, next) {
  try {
    const shipment = await shipmentService.assignCarrier(
      req.params.id,
      req.body.carrierId,
      req.body.expectedVersion,
    );
    res.status(200).json(shipment);
  } catch (err) {
    next(err);
  }
}

async function updateDelivery(req, res, next) {
  try {
    const shipment = await shipmentService.updateDelivery(req.params.id, req.user, req.body);
    res.status(200).json(shipment);
  } catch (err) {
    next(err);
  }
}

module.exports = { quote, create, getById, trackPublic, list, updateStatus, assignCarrier, updateDelivery };
