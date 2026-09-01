const express = require('express');
const { validate, authenticate, requireRole, optionalAuthenticate, cacheControl } = require('@shiptrack/common');
const controller = require('../controllers/analyticsController');
const { recordEventSchema } = require('../middleware/schemas');

const router = express.Router();

// Ingested by other services (server-to-server) as business events happen, so auth is optional.
router.post('/events', optionalAuthenticate, validate(recordEventSchema), controller.recordEvent);

router.get('/summary', authenticate, requireRole('ADMIN'), cacheControl(30), controller.summary);
router.get('/customers/top', authenticate, requireRole('ADMIN'), cacheControl(30), controller.topCustomers);
router.get('/carriers/performance', authenticate, requireRole('ADMIN'), cacheControl(30), controller.carrierPerformance);

module.exports = router;
