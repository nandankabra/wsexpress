const { pool } = require('../db/pool');

async function create(data, client = pool) {
  const orderNumber = data.orderNumber || `ORD-${data.trackingId}`;
  const orderStatus = data.orderStatus || 'PENDING_PAYMENT';
  const paymentStatus = data.paymentStatus || 'AWAITING_PAYMENT';
  const distanceKm = data.distanceKm || 0;
  const pricingBreakdown = data.pricingBreakdown ? JSON.stringify(data.pricingBreakdown) : null;
  const pricingVersion = data.pricingVersion || 'v2.1';

  const { rows } = await client.query(
    `INSERT INTO shipments
       (tracking_id, customer_id, origin_address, origin_city, origin_country,
        destination_address, destination_city, destination_country, weight_kg,
        dimensions_cm, package_type, service_type,
        quoted_price, base_fare, distance_charge, weight_charge, tax_amount, total_amount, currency,
        estimated_delivery_date, current_hub_id, destination_hub_id,
        order_number, order_status, payment_status, distance_km, pricing_breakdown, pricing_version)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)
     RETURNING *`,
    [
      data.trackingId, data.customerId, data.originAddress, data.originCity, data.originCountry,
      data.destinationAddress, data.destinationCity, data.destinationCountry, data.weightKg,
      data.dimensionsCm, data.packageType, data.serviceType,
      data.quotedPrice, data.baseFare, data.distanceCharge, data.weightCharge, data.taxAmount, data.totalAmount, data.currency,
      data.estimatedDeliveryDate, data.currentHubId, data.destinationHubId,
      orderNumber, orderStatus, paymentStatus, distanceKm, pricingBreakdown, pricingVersion
    ],
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM shipments WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findByTrackingId(trackingId) {
  const { rows } = await pool.query('SELECT * FROM shipments WHERE tracking_id = $1', [trackingId]);
  return rows[0] || null;
}

async function findByOrderNumber(orderNumber) {
  const { rows } = await pool.query('SELECT * FROM shipments WHERE order_number = $1', [orderNumber]);
  return rows[0] || null;
}

async function updatePaymentStatus(id, { paymentStatus, orderStatus }, client = pool) {
  const { rows } = await client.query(
    `UPDATE shipments
     SET payment_status = $2,
         order_status = $3,
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, paymentStatus, orderStatus],
  );
  return rows[0] || null;
}

async function listPage({ limit, afterId, customerId, carrierId, carrierScope, status }) {
  const clauses = ['($1::uuid IS NULL OR id > $1)'];
  const params = [afterId || null];

  if (customerId) {
    params.push(customerId);
    clauses.push(`customer_id = $${params.length}`);
  }
  if (carrierScope) {
    params.push(carrierScope);
    clauses.push(`(assigned_driver_id = $${params.length} OR (assigned_driver_id IS NULL AND status IN ('CREATED', 'ARRIVED_AT_HUB')))`);
  } else if (carrierId) {
    params.push(carrierId);
    clauses.push(`assigned_driver_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    clauses.push(`status = $${params.length}`);
  }

  params.push(limit + 1);
  const { rows } = await pool.query(
    `SELECT * FROM shipments WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC, id DESC LIMIT $${params.length}`,
    params,
  );
  return rows;
}

async function listOrdersAdmin({
  page = 1,
  limit = 20,
  search,
  orderStatus,
  paymentStatus,
  shipmentStatus,
  serviceType,
  originCity,
  destinationCity,
  startDate,
  endDate,
  sortBy = 'created_desc',
}) {
  const clauses = ['1=1'];
  const params = [];

  if (search && search.trim()) {
    const s = `%${search.trim()}%`;
    params.push(s);
    clauses.push(
      `(order_number ILIKE $${params.length} OR tracking_id ILIKE $${params.length} OR origin_city ILIKE $${params.length} OR destination_city ILIKE $${params.length})`
    );
  }

  if (orderStatus) {
    params.push(orderStatus);
    clauses.push(`order_status = $${params.length}`);
  }

  if (paymentStatus) {
    params.push(paymentStatus);
    clauses.push(`payment_status = $${params.length}`);
  }

  if (shipmentStatus) {
    params.push(shipmentStatus);
    clauses.push(`status = $${params.length}`);
  }

  if (serviceType) {
    params.push(serviceType);
    clauses.push(`service_type = $${params.length}`);
  }

  if (originCity) {
    params.push(`%${originCity.trim()}%`);
    clauses.push(`origin_city ILIKE $${params.length}`);
  }

  if (destinationCity) {
    params.push(`%${destinationCity.trim()}%`);
    clauses.push(`destination_city ILIKE $${params.length}`);
  }

  if (startDate) {
    params.push(startDate);
    clauses.push(`created_at >= $${params.length}`);
  }

  if (endDate) {
    params.push(endDate);
    clauses.push(`created_at <= $${params.length}`);
  }

  // Sorting
  let orderByClause = 'ORDER BY created_at DESC, id DESC';
  if (sortBy === 'created_asc') {
    orderByClause = 'ORDER BY created_at ASC, id ASC';
  } else if (sortBy === 'price_desc') {
    orderByClause = 'ORDER BY total_amount DESC, id DESC';
  } else if (sortBy === 'price_asc') {
    orderByClause = 'ORDER BY total_amount ASC, id ASC';
  } else if (sortBy === 'updated_desc') {
    orderByClause = 'ORDER BY updated_at DESC, id DESC';
  }

  const whereSql = clauses.join(' AND ');

  // 1. Total matching count
  const countRes = await pool.query(`SELECT COUNT(*) as total FROM shipments WHERE ${whereSql}`, params);
  const total = Number(countRes.rows[0]?.total || 0);

  // 2. Paginated rows
  const offset = (Math.max(1, page) - 1) * limit;
  params.push(limit);
  const limitParamIdx = params.length;
  params.push(offset);
  const offsetParamIdx = params.length;

  const dataRes = await pool.query(
    `SELECT * FROM shipments WHERE ${whereSql} ${orderByClause} LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`,
    params,
  );

  // 3. Overall Order & Payment Metric Summary
  const summaryRes = await pool.query(`
    SELECT
      COUNT(*) as total_orders,
      COUNT(*) FILTER (WHERE order_status = 'PENDING_PAYMENT') as pending_orders,
      COUNT(*) FILTER (WHERE payment_status = 'AWAITING_PAYMENT') as awaiting_payment,
      COUNT(*) FILTER (WHERE payment_status = 'PAID') as paid_orders,
      COUNT(*) FILTER (WHERE status = 'CREATED' AND payment_status = 'PAID') as processing_orders,
      COUNT(*) FILTER (WHERE status IN ('PICKED_UP', 'ARRIVED_AT_HUB', 'IN_TRANSIT', 'OUT_FOR_DELIVERY')) as in_transit_orders,
      COUNT(*) FILTER (WHERE status = 'DELIVERED') as delivered_orders,
      COUNT(*) FILTER (WHERE status = 'CANCELLED' OR order_status = 'CANCELLED') as cancelled_orders,
      COUNT(*) FILTER (WHERE payment_status IN ('FAILED', 'REFUNDED')) as failed_refunded_orders,
      COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'PAID'), 0) as total_revenue
    FROM shipments
  `);

  const summary = {
    totalOrders: Number(summaryRes.rows[0]?.total_orders || 0),
    pendingOrders: Number(summaryRes.rows[0]?.pending_orders || 0),
    awaitingPayment: Number(summaryRes.rows[0]?.awaiting_payment || 0),
    paidOrders: Number(summaryRes.rows[0]?.paid_orders || 0),
    processingOrders: Number(summaryRes.rows[0]?.processing_orders || 0),
    inTransitOrders: Number(summaryRes.rows[0]?.in_transit_orders || 0),
    deliveredOrders: Number(summaryRes.rows[0]?.delivered_orders || 0),
    cancelledOrders: Number(summaryRes.rows[0]?.cancelled_orders || 0),
    failedRefundedOrders: Number(summaryRes.rows[0]?.failed_refunded_orders || 0),
    totalRevenue: Number(summaryRes.rows[0]?.total_revenue || 0),
  };

  return {
    rows: dataRes.rows,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit) || 1,
    summary,
  };
}

async function updateStatus(id, { status, expectedVersion, assignedDriverId }) {
  const params = [id, status];
  let driverClause = '';
  if (assignedDriverId !== undefined) {
    params.push(assignedDriverId);
    driverClause = `, assigned_driver_id = $${params.length}, carrier_id = $${params.length}`;
  }
  params.push(expectedVersion);
  const { rows } = await pool.query(
    `UPDATE shipments
     SET status = $2, version = version + 1, updated_at = now() ${driverClause}
     WHERE id = $1 AND version = $${params.length}
     RETURNING *`,
    params,
  );
  return rows[0] || null;
}

async function assignCarrier(id, carrierId, expectedVersion) {
  const params = [id, carrierId];
  let versionClause = '';
  if (expectedVersion !== undefined && expectedVersion !== null) {
    params.push(expectedVersion);
    versionClause = `AND version = $${params.length}`;
  }
  const { rows } = await pool.query(
    `UPDATE shipments
     SET carrier_id = $2,
         assigned_driver_id = $2,
         status = CASE WHEN status = 'CREATED' THEN 'ASSIGNED' ELSE status END,
         version = version + 1,
         updated_at = now()
     WHERE id = $1 ${versionClause}
     RETURNING *`,
    params,
  );
  if (!rows[0] && versionClause) {
    const retryRes = await pool.query(
      `UPDATE shipments
       SET carrier_id = $2,
           assigned_driver_id = $2,
           status = CASE WHEN status = 'CREATED' THEN 'ASSIGNED' ELSE status END,
           version = version + 1,
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, carrierId],
    );
    return retryRes.rows[0] || null;
  }
  return rows[0] || null;
}

async function updateDelivery(id, { actualDeliveryDate, deliveryNotes, expectedVersion }) {
  const { rows } = await pool.query(
    `UPDATE shipments
     SET actual_delivery_date = COALESCE($2, actual_delivery_date),
         delivery_notes = COALESCE($3, delivery_notes),
         version = version + 1,
         updated_at = now()
     WHERE id = $1 AND version = $4
     RETURNING *`,
    [id, actualDeliveryDate || null, deliveryNotes || null, expectedVersion],
  );
  return rows[0] || null;
}

module.exports = {
  create,
  findById,
  findByTrackingId,
  findByOrderNumber,
  updatePaymentStatus,
  listPage,
  listOrdersAdmin,
  updateStatus,
  assignCarrier,
  updateDelivery,
};
