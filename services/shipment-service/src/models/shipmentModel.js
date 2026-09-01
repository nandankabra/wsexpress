const { pool } = require('../db/pool');

async function create(data) {
  const { rows } = await pool.query(
    `INSERT INTO shipments
       (tracking_id, customer_id, origin_address, origin_city, origin_country,
        destination_address, destination_city, destination_country, weight_kg,
        package_type, quoted_price, currency, estimated_delivery_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      data.trackingId, data.customerId, data.originAddress, data.originCity, data.originCountry,
      data.destinationAddress, data.destinationCity, data.destinationCountry, data.weightKg,
      data.packageType, data.quotedPrice, data.currency, data.estimatedDeliveryDate,
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
    // A carrier's shipment list includes shipments already assigned to them plus
    // unassigned ones available to claim (mirrors the single-resource view/claim rules).
    params.push(carrierScope);
    clauses.push(`(carrier_id = $${params.length} OR carrier_id IS NULL)`);
  } else if (carrierId) {
    params.push(carrierId);
    clauses.push(`carrier_id = $${params.length}`);
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

async function updateStatus(id, { status, expectedVersion, carrierId }) {
  const params = [id, status];
  let carrierClause = '';
  if (carrierId) {
    params.push(carrierId);
    carrierClause = `, carrier_id = $${params.length}`;
  }
  params.push(expectedVersion);
  const { rows } = await pool.query(
    `UPDATE shipments
     SET status = $2, version = version + 1, updated_at = now() ${carrierClause}
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
