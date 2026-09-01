const { pool } = require('../db/pool');

async function upsert(userId, data) {
  const { rows } = await pool.query(
    `INSERT INTO carriers
       (user_id, company_name, contact_email, contact_phone, vehicle_type, license_number, service_areas)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id) DO UPDATE SET
       company_name = EXCLUDED.company_name,
       contact_email = EXCLUDED.contact_email,
       contact_phone = EXCLUDED.contact_phone,
       vehicle_type = EXCLUDED.vehicle_type,
       license_number = EXCLUDED.license_number,
       service_areas = EXCLUDED.service_areas,
       updated_at = now()
     RETURNING *`,
    [
      userId, data.companyName, data.contactEmail, data.contactPhone || null,
      data.vehicleType || null, data.licenseNumber || null, data.serviceAreas || null,
    ],
  );
  return rows[0];
}

async function findByUserId(userId) {
  const { rows } = await pool.query('SELECT * FROM carriers WHERE user_id = $1', [userId]);
  return rows[0] || null;
}

async function setVerified(userId, isVerified) {
  const { rows } = await pool.query(
    'UPDATE carriers SET is_verified = $2, updated_at = now() WHERE user_id = $1 RETURNING *',
    [userId, isVerified],
  );
  return rows[0] || null;
}

async function listPage({ limit, afterUserId }) {
  const { rows } = await pool.query(
    `SELECT * FROM carriers
     WHERE ($1::uuid IS NULL OR user_id > $1)
     ORDER BY user_id ASC
     LIMIT $2`,
    [afterUserId || null, limit + 1],
  );
  return rows;
}

module.exports = { upsert, findByUserId, setVerified, listPage };
