const express = require('express');
const { validate, authenticate, requireRole, etag, cacheControl } = require('@shiptrack/common');
const controller = require('../controllers/profileController');
const { upsertProfileSchema } = require('../middleware/schemas');

const router = express.Router();

router.get('/me', authenticate, requireRole('CUSTOMER'), etag(), cacheControl(30), controller.getMe);
router.put('/me', authenticate, requireRole('CUSTOMER'), validate(upsertProfileSchema), controller.putMe);
router.get('/', authenticate, requireRole('ADMIN'), controller.list);
router.get('/:userId', authenticate, requireRole('ADMIN'), etag(), controller.getById);

module.exports = router;
