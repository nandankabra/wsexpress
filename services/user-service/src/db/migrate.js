const { pool } = require('./pool');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS customer_profiles (
  user_id UUID PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(30),
  address_line1 VARCHAR(160),
  address_line2 VARCHAR(160),
  city VARCHAR(80),
  state VARCHAR(80),
  postal_code VARCHAR(20),
  country VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

async function migrate() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  await pool.query(SCHEMA);
}

module.exports = { migrate };
