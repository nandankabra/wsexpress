const crypto = require('crypto');
const { ApiError } = require('@shiptrack/common');
const { pool } = require('../db/pool');
const shipmentModel = require('../models/shipmentModel');
const paymentModel = require('../models/paymentModel');
const { simulatePayment } = require('../payments/simulator');

function computeFingerprint(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function sanitizePayment(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderId: row.order_id,
    customerId: row.customer_id,
    paymentReference: row.payment_reference,
    provider: row.provider,
    paymentMethod: row.payment_method,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    testMode: Boolean(row.test_mode),
    failureCode: row.failure_code,
    errorMessage: row.error_message,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function processPayment({ customerId, orderId, paymentMethod, paymentDetails, idempotencyKey, correlationId }) {
  if (!orderId) throw ApiError.badRequest('orderId is required');
  if (!paymentMethod) throw ApiError.badRequest('paymentMethod is required');
  if (!idempotencyKey) throw ApiError.badRequest('idempotencyKey is required (X-Idempotency-Key header or body)');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Idempotency Check & Lock
    const requestFingerprint = computeFingerprint({ orderId, paymentMethod, paymentDetails });
    const existingIdem = await paymentModel.findIdempotency(idempotencyKey, client);

    if (existingIdem) {
      if (existingIdem.request_hash !== requestFingerprint) {
        await client.query('ROLLBACK');
        throw ApiError.conflict('Idempotency key has already been used with different request parameters');
      }
      if (existingIdem.status === 'PROCESSING') {
        await client.query('ROLLBACK');
        throw ApiError.conflict('A payment request with this idempotency key is currently processing. Please retry shortly.');
      }
      if (existingIdem.status === 'COMPLETED') {
        await client.query('COMMIT');
        return typeof existingIdem.response_json === 'string'
          ? JSON.parse(existingIdem.response_json)
          : existingIdem.response_json;
      }
    } else {
      await paymentModel.createIdempotency({
        idempotencyKey,
        userId: customerId,
        orderId,
        requestHash: requestFingerprint,
        status: 'PROCESSING',
      }, client);
    }

    // 2. Authoritative Order Lookup with Row Lock
    const orderRes = await client.query('SELECT * FROM shipments WHERE id = $1 FOR UPDATE', [orderId]);
    const order = orderRes.rows[0];
    if (!order) {
      await client.query('ROLLBACK');
      throw ApiError.notFound('Order not found');
    }

    // 3. Authorization & Ownership Verification
    if (order.customer_id !== customerId) {
      await client.query('ROLLBACK');
      throw ApiError.forbidden('You do not have permission to pay for this order');
    }

    // 4. Validate Order State
    if (order.payment_status === 'PAID') {
      await client.query('ROLLBACK');
      throw ApiError.unprocessable('This order has already been paid successfully');
    }
    if (order.status === 'CANCELLED' || order.order_status === 'CANCELLED') {
      await client.query('ROLLBACK');
      throw ApiError.unprocessable('Cannot pay for a cancelled order');
    }

    // 5. Authoritative Server Amount (Never Trust Client Amount)
    const authoritativeAmount = Number(order.total_amount || order.quoted_price || 0);
    const authoritativeCurrency = order.currency || 'INR';

    // 6. Execute Test Mode Payment Simulation
    const simResult = await simulatePayment({
      method: paymentMethod,
      details: paymentDetails || {},
      amount: authoritativeAmount,
      currency: authoritativeCurrency,
      orderId,
    });

    // 7. Persist Payment Record
    const paymentRecord = await paymentModel.createPayment({
      orderId,
      customerId,
      paymentReference: simResult.paymentReference,
      provider: simResult.provider,
      paymentMethod: simResult.paymentMethod,
      amount: simResult.amount,
      currency: simResult.currency,
      status: simResult.status,
      testMode: simResult.testMode,
      failureCode: simResult.failureCode,
      errorMessage: simResult.errorMessage,
      metadata: simResult.metadata,
    }, client);

    // 8. Record Audit Payment Event
    await paymentModel.createPaymentEvent({
      paymentId: paymentRecord.id,
      orderId,
      eventType: simResult.status === 'SUCCESS' ? 'PAYMENT_SUCCESSFUL' : 'PAYMENT_FAILED',
      source: 'TEST_SIMULATOR',
      oldStatus: order.payment_status,
      newStatus: simResult.status === 'SUCCESS' ? 'PAID' : 'FAILED',
      metadata: {
        paymentReference: simResult.paymentReference,
        failureCode: simResult.failureCode,
        correlationId,
      },
    }, client);

    // 9. Synchronize Order & Shipment State
    let updatedOrder;
    if (simResult.status === 'SUCCESS') {
      const updateRes = await client.query(
        `UPDATE shipments
         SET payment_status = 'PAID',
             order_status = 'CONFIRMED',
             updated_at = now()
         WHERE id = $1
         RETURNING *`,
        [orderId],
      );
      updatedOrder = updateRes.rows[0];
    } else {
      const updateRes = await client.query(
        `UPDATE shipments
         SET payment_status = 'FAILED',
             updated_at = now()
         WHERE id = $1
         RETURNING *`,
        [orderId],
      );
      updatedOrder = updateRes.rows[0];
    }

    const responsePayload = {
      success: simResult.status === 'SUCCESS',
      payment: sanitizePayment(paymentRecord),
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.order_number,
        trackingId: updatedOrder.tracking_id,
        orderStatus: updatedOrder.order_status,
        paymentStatus: updatedOrder.payment_status,
        shipmentStatus: updatedOrder.status,
        amount: Number(updatedOrder.total_amount),
        currency: updatedOrder.currency,
      },
      testMode: true,
      message: simResult.status === 'SUCCESS'
        ? 'Test payment completed successfully'
        : (simResult.errorMessage || 'Payment simulation failed'),
    };

    // 10. Update Idempotency State to Completed
    await paymentModel.updateIdempotency(idempotencyKey, {
      status: 'COMPLETED',
      responseJson: responsePayload,
    }, client);

    await client.query('COMMIT');
    return responsePayload;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getOrderPayments(orderId, actor) {
  const order = await shipmentModel.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  if (actor.role === 'CUSTOMER' && order.customer_id !== actor.sub) {
    throw ApiError.forbidden('You do not have access to this order');
  }

  const [payments, events] = await Promise.all([
    paymentModel.findPaymentsByOrderId(orderId),
    paymentModel.findPaymentEvents(orderId),
  ]);

  return {
    orderId,
    orderNumber: order.order_number,
    trackingId: order.tracking_id,
    orderStatus: order.order_status,
    paymentStatus: order.payment_status,
    totalAmount: Number(order.total_amount),
    currency: order.currency,
    payments: payments.map(sanitizePayment),
    events,
    testMode: true,
  };
}

module.exports = {
  processPayment,
  getOrderPayments,
  sanitizePayment,
};
