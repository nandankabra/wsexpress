const express = require('express');
const { validate, authenticate, requireRole, etag, cacheControl } = require('@shiptrack/common');
const controller = require('../controllers/carrierController');
const { upsertCarrierSchema, verifySchema, adminCreateSchema } = require('../middleware/schemas');

const router = express.Router();

router.get('/me', authenticate, requireRole('CARRIER'), etag(), cacheControl(30), controller.getMe);
router.put('/me', authenticate, requireRole('CARRIER'), validate(upsertCarrierSchema), controller.putMe);
router.post('/admin/profiles', authenticate, requireRole('ADMIN'), validate(adminCreateSchema), controller.createProfile);
router.get('/', authenticate, requireRole('ADMIN'), controller.list);
router.get('/:userId', authenticate, requireRole('ADMIN'), etag(), controller.getById);
router.patch('/:userId/verify', authenticate, requireRole('ADMIN'), validate(verifySchema), controller.verify);

module.exports = router;
