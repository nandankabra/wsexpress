const { pool } = require('./pool');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID NOT NULL,
  carrier_id UUID,
  assigned_driver_id UUID,
  current_hub_id VARCHAR(50),
  destination_hub_id VARCHAR(50),
  origin_address VARCHAR(200) NOT NULL,
  origin_city VARCHAR(80) NOT NULL,
  origin_country VARCHAR(80) NOT NULL,
  destination_address VARCHAR(200) NOT NULL,
  destination_city VARCHAR(80) NOT NULL,
  destination_country VARCHAR(80) NOT NULL,
  weight_kg NUMERIC(10,2) NOT NULL,
  dimensions_cm JSONB DEFAULT '{"length": 10, "width": 10, "height": 10}'::jsonb,
  package_type VARCHAR(40) NOT NULL DEFAULT 'PARCEL',
  service_type VARCHAR(40) NOT NULL DEFAULT 'STANDARD',
  status VARCHAR(30) NOT NULL DEFAULT 'CREATED'
    CHECK (status IN ('CREATED','ASSIGNED','PICKED_UP','ARRIVED_AT_HUB','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','CANCELLED')),
  quoted_price NUMERIC(10,2),
  base_fare NUMERIC(10,2) DEFAULT 0,
  distance_charge NUMERIC(10,2) DEFAULT 0,
  weight_charge NUMERIC(10,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) DEFAULT 0,
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
  
  // Re-creating the schema is safe, it says IF NOT EXISTS
  await pool.query(SCHEMA);
  
  await pool.query("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS assigned_driver_id UUID");
  await pool.query("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS current_hub_id VARCHAR(50)");
  await pool.query("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS destination_hub_id VARCHAR(50)");
  await pool.query("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS dimensions_cm JSONB DEFAULT '{\"length\": 10, \"width\": 10, \"height\": 10}'::jsonb");
  await pool.query("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS service_type VARCHAR(40) NOT NULL DEFAULT 'STANDARD'");
  
  await pool.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS base_fare NUMERIC(10,2) DEFAULT 0');
  await pool.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS distance_charge NUMERIC(10,2) DEFAULT 0');
  await pool.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS weight_charge NUMERIC(10,2) DEFAULT 0');
  await pool.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2) DEFAULT 0');
  await pool.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2) DEFAULT 0');
  
  // Drop and recreate status check constraint to support new statuses
  await pool.query('ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_status_check');
  await pool.query("ALTER TABLE shipments ADD CONSTRAINT shipments_status_check CHECK (status IN ('CREATED','ASSIGNED','PICKED_UP','ARRIVED_AT_HUB','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'))");
}

module.exports = { migrate };
