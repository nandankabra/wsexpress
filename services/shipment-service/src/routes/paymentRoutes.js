const express = require('express');
const { authenticate, validate } = require('@shiptrack/common');
const controller = require('../controllers/paymentController');

const router = express.Router();

const processPaymentSchema = {
  type: 'object',
  required: ['orderId', 'paymentMethod'],
  properties: {
    orderId: { type: 'string', format: 'uuid' },
    paymentMethod: { type: 'string', enum: ['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'WALLET'] },
    paymentDetails: { type: 'object' },
    idempotencyKey: { type: 'string' },
  },
};

router.post('/process', authenticate, validate(processPaymentSchema), controller.processPayment);
router.get('/order/:orderId', authenticate, controller.getOrderPayments);

module.exports = router;
