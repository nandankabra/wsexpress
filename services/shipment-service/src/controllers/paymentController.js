const paymentService = require('../services/paymentService');

async function processPayment(req, res, next) {
  try {
    const customerId = req.user.sub;
    const idempotencyKey = req.headers['x-idempotency-key'] || req.body.idempotencyKey;
    const correlationId = req.correlationId;

    const result = await paymentService.processPayment({
      customerId,
      orderId: req.body.orderId,
      paymentMethod: req.body.paymentMethod,
      paymentDetails: req.body.paymentDetails,
      idempotencyKey,
      correlationId,
    });

    res.status(result.success ? 200 : 402).json(result);
  } catch (err) {
    next(err);
  }
}

async function getOrderPayments(req, res, next) {
  try {
    const { orderId } = req.params;
    const result = await paymentService.getOrderPayments(orderId, req.user);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  processPayment,
  getOrderPayments,
};
