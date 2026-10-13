const { pool } = require('../db/pool');

async function createPayment(data, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO payments
       (order_id, customer_id, payment_reference, provider, payment_method,
        amount, currency, status, test_mode, failure_code, error_message, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      data.orderId,
      data.customerId,
      data.paymentReference,
      data.provider || 'TEST_SIMULATOR',
      data.paymentMethod,
      data.amount,
      data.currency || 'INR',
      data.status || 'PENDING',
      data.testMode !== false,
      data.failureCode || null,
      data.errorMessage || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ],
  );
  return rows[0];
}

async function findPaymentById(id) {
  const { rows } = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findPaymentsByOrderId(orderId) {
  const { rows } = await pool.query(
    'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC',
    [orderId],
  );
  return rows;
}

async function findLatestPaymentByOrderId(orderId) {
  const { rows } = await pool.query(
    'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1',
    [orderId],
  );
  return rows[0] || null;
}

async function findIdempotency(key, client = pool) {
  const { rows } = await client.query(
    'SELECT * FROM payment_idempotency WHERE idempotency_key = $1',
    [key],
  );
  return rows[0] || null;
}

async function createIdempotency({ idempotencyKey, userId, orderId, requestHash, status = 'PROCESSING', responseJson = null }, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO payment_idempotency
       (idempotency_key, user_id, order_id, request_hash, status, response_json)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [idempotencyKey, userId, orderId, requestHash, status, responseJson ? JSON.stringify(responseJson) : null],
  );
  return rows[0];
}

async function updateIdempotency(key, { status, responseJson }, client = pool) {
  const { rows } = await client.query(
    `UPDATE payment_idempotency
     SET status = $2, response_json = $3
     WHERE idempotency_key = $1
     RETURNING *`,
    [key, status, responseJson ? JSON.stringify(responseJson) : null],
  );
  return rows[0] || null;
}

async function createPaymentEvent({ paymentId, orderId, eventType, source = 'PAYMENT_SIMULATOR', oldStatus, newStatus, metadata }, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO payment_events
       (payment_id, order_id, event_type, source, old_status, new_status, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [paymentId, orderId, eventType, source, oldStatus || null, newStatus || null, metadata ? JSON.stringify(metadata) : null],
  );
  return rows[0];
}

async function findPaymentEvents(orderId) {
  const { rows } = await pool.query(
    'SELECT * FROM payment_events WHERE order_id = $1 ORDER BY created_at ASC',
    [orderId],
  );
  return rows;
}

module.exports = {
  createPayment,
  findPaymentById,
  findPaymentsByOrderId,
  findLatestPaymentByOrderId,
  findIdempotency,
  createIdempotency,
  updateIdempotency,
  createPaymentEvent,
  findPaymentEvents,
};
