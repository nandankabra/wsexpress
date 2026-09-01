const { pool } = require('./pool');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS carriers (
  user_id UUID PRIMARY KEY,
  company_name VARCHAR(160) NOT NULL,
  contact_email VARCHAR(160) NOT NULL,
  contact_phone VARCHAR(30),
  vehicle_type VARCHAR(60),
  license_number VARCHAR(60),
  service_areas TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

async function migrate() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  await pool.query(SCHEMA);
}

module.exports = { migrate };
