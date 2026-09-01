const express = require('express');
const { validate, authenticate, requireRole, optionalAuthenticate } = require('@shiptrack/common');
const controller = require('../controllers/auditController');
const { recordLogSchema } = require('../middleware/schemas');

const router = express.Router();

// Ingested by every other service (and the API gateway) as requests and security events
// happen - server-to-server, so auth is optional rather than required.
router.post('/logs', optionalAuthenticate, validate(recordLogSchema), controller.recordLog);
router.get('/logs', authenticate, requireRole('ADMIN'), controller.listLogs);

module.exports = router;
