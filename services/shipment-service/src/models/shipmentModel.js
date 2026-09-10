const { pool } = require('../db/pool');

async function create(data) {
  const { rows } = await pool.query(
    `INSERT INTO shipments
       (tracking_id, customer_id, origin_address, origin_city, origin_country,
        destination_address, destination_city, destination_country, weight_kg,
        dimensions_cm, package_type, service_type,
        quoted_price, base_fare, distance_charge, weight_charge, tax_amount, total_amount, currency,
        estimated_delivery_date, current_hub_id, destination_hub_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
     RETURNING *`,
    [
      data.trackingId, data.customerId, data.originAddress, data.originCity, data.originCountry,
      data.destinationAddress, data.destinationCity, data.destinationCountry, data.weightKg,
      data.dimensionsCm, data.packageType, data.serviceType,
      data.quotedPrice, data.baseFare, data.distanceCharge, data.weightCharge, data.taxAmount, data.totalAmount, data.currency,
      data.estimatedDeliveryDate, data.currentHubId, data.destinationHubId
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

async function listPage({ limit, afterId, customerId, carrierId, carrierScope, status }) {
  const clauses = ['($1::uuid IS NULL OR id > $1)'];
  const params = [afterId || null];

  if (customerId) {
    params.push(customerId);
    clauses.push(`customer_id = $${params.length}`);
  }
  if (carrierScope) {
    // Carrier sees their assigned shipments or unassigned shipments they can claim
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
    `SELECT * FROM shipments WHERE ${clauses.join(' AND ')} ORDER BY id ASC LIMIT $${params.length}`,
    params,
  );
  return rows;
}

async function updateStatus(id, { status, expectedVersion, assignedDriverId }) {
  const params = [id, status];
  let driverClause = '';
  if (assignedDriverId !== undefined) {
    params.push(assignedDriverId);
    driverClause = `, assigned_driver_id = $${params.length}, carrier_id = $${params.length}`; // carrier_id kept for backward compat temporarily
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
  const { rows } = await pool.query(
    `UPDATE shipments
     SET carrier_id = $2, version = version + 1, updated_at = now()
     WHERE id = $1 AND version = $3
     RETURNING *`,
    [id, carrierId, expectedVersion],
  );
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
  create, findById, findByTrackingId, listPage, updateStatus, assignCarrier, updateDelivery,
};
