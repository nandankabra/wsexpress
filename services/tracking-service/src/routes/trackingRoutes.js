const express = require('express');
const { validate, optionalAuthenticate, cacheControl } = require('@shiptrack/common');
const controller = require('../controllers/trackingController');
const { recordEventSchema } = require('../middleware/schemas');

const router = express.Router();

// Creation is reachable both by an authenticated carrier/admin from the frontend and by
// shipment-service's server-to-server call (no user JWT) - hence optionalAuthenticate rather
// than a hard requireRole. recordedBy falls back to 'system' when there's no caller identity.
router.post('/:trackingId/events', optionalAuthenticate, validate(recordEventSchema), controller.recordEvent);

// Anyone holding a tracking ID can view its event history, mirroring real-world carrier
// tracking pages - this is the "Guest: Search Public Tracking IDs" capability.
router.get('/:trackingId/events', cacheControl(10), controller.listEvents);
router.get('/:trackingId/latest', cacheControl(10), controller.latest);

module.exports = router;
