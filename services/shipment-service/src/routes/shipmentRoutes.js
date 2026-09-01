const express = require('express');
const { validate, authenticate, requireRole, idempotency, etag, cacheControl } = require('@shiptrack/common');
const controller = require('../controllers/shipmentController');
const schemas = require('../middleware/schemas');

const router = express.Router();

router.post('/quotes', authenticate, requireRole('CUSTOMER'), validate(schemas.quoteSchema), controller.quote);
router.post(
  '/',
  authenticate,
  requireRole('CUSTOMER'),
  idempotency(),
  validate(schemas.createShipmentSchema),
  controller.create,
);
router.get('/', authenticate, controller.list);
router.get('/track/:trackingId', cacheControl(10), controller.trackPublic);
router.get('/:id', authenticate, etag(), controller.getById);
router.patch(
  '/:id/status',
  authenticate,
  requireRole('CARRIER', 'ADMIN'),
  validate(schemas.updateStatusSchema),
  controller.updateStatus,
);
router.patch(
  '/:id/assign-carrier',
  authenticate,
  requireRole('ADMIN'),
  validate(schemas.assignCarrierSchema),
  controller.assignCarrier,
);
router.patch(
  '/:id/delivery',
  authenticate,
  requireRole('CARRIER', 'ADMIN'),
  validate(schemas.updateDeliverySchema),
  controller.updateDelivery,
);

module.exports = router;
