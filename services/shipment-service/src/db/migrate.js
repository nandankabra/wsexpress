const { pool } = require('./pool');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID NOT NULL,
  carrier_id UUID,
  origin_address VARCHAR(200) NOT NULL,
  origin_city VARCHAR(80) NOT NULL,
  origin_country VARCHAR(80) NOT NULL,
  destination_address VARCHAR(200) NOT NULL,
  destination_city VARCHAR(80) NOT NULL,
  destination_country VARCHAR(80) NOT NULL,
  weight_kg NUMERIC(10,2) NOT NULL,
  package_type VARCHAR(40) NOT NULL DEFAULT 'PARCEL',
  status VARCHAR(30) NOT NULL DEFAULT 'CREATED'
    CHECK (status IN ('CREATED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','CANCELLED')),
  quoted_price NUMERIC(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  delivery_notes VARCHAR(500),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipments_customer_id ON shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier_id ON shipments(carrier_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_id ON shipments(tracking_id);
`;

async function migrate() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  await pool.query(SCHEMA);
}

module.exports = { migrate };
