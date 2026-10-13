const express = require('express');
const { validate, authenticate, requireRole, cacheControl } = require('@shiptrack/common');
const controller = require('../controllers/pricingController');
const schemas = require('../middleware/schemas');

const router = express.Router();

router.post('/quote', validate(schemas.quoteSchema), controller.quote);
router.post('/convert', validate(schemas.convertSchema), controller.convert);
router.get('/rules', cacheControl(60), controller.listRules);
router.put('/rules', authenticate, requireRole('ADMIN'), validate(schemas.upsertRuleSchema), controller.upsertRule);
router.get('/config', controller.getConfig);
router.put('/config', authenticate, requireRole('ADMIN'), validate(schemas.updateConfigSchema), controller.updateConfig);

module.exports = router;

