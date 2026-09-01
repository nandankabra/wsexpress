const { pool } = require('../db/pool');

const COLUMNS = [
  'user_id', 'full_name', 'email', 'phone',
  'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
];

async function upsert(userId, data) {
  const { rows } = await pool.query(
    `INSERT INTO customer_profiles
       (user_id, full_name, email, phone, address_line1, address_line2, city, state, postal_code, country)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (user_id) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       email = EXCLUDED.email,
       phone = EXCLUDED.phone,
       address_line1 = EXCLUDED.address_line1,
       address_line2 = EXCLUDED.address_line2,
       city = EXCLUDED.city,
       state = EXCLUDED.state,
       postal_code = EXCLUDED.postal_code,
       country = EXCLUDED.country,
       updated_at = now()
     RETURNING *`,
    [
      userId, data.fullName, data.email, data.phone || null,
      data.addressLine1 || null, data.addressLine2 || null, data.city || null,
      data.state || null, data.postalCode || null, data.country || null,
    ],
  );
  return rows[0];
}

async function findByUserId(userId) {
  const { rows } = await pool.query('SELECT * FROM customer_profiles WHERE user_id = $1', [userId]);
  return rows[0] || null;
}

async function listPage({ limit, afterUserId }) {
  const { rows } = await pool.query(
    `SELECT * FROM customer_profiles
     WHERE ($1::uuid IS NULL OR user_id > $1)
     ORDER BY user_id ASC
     LIMIT $2`,
    [afterUserId || null, limit + 1],
  );
  return rows;
}

module.exports = { upsert, findByUserId, listPage, COLUMNS };
