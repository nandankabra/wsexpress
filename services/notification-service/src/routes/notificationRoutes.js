const express = require('express');
const { validate, authenticate, requireRole, optionalAuthenticate } = require('@shiptrack/common');
const controller = require('../controllers/notificationController');
const { sendNotificationSchema } = require('../middleware/schemas');

const router = express.Router();

router.post('/send', optionalAuthenticate, validate(sendNotificationSchema), controller.send);
router.get('/', authenticate, requireRole('ADMIN'), controller.list);

module.exports = router;
