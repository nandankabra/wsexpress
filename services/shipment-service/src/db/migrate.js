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

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  payment_reference VARCHAR(60) UNIQUE NOT NULL,
  provider VARCHAR(30) NOT NULL DEFAULT 'TEST_SIMULATOR',
  payment_method VARCHAR(30) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','SUCCESS','FAILED','CANCELLED','REFUNDED')),
  test_mode BOOLEAN NOT NULL DEFAULT true,
  failure_code VARCHAR(50),
  error_message VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_idempotency (
  idempotency_key VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID NOT NULL,
  request_hash VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING',
  response_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  order_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'PAYMENT_SIMULATOR',
  old_status VARCHAR(30),
  new_status VARCHAR(30),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipments_customer_id ON shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier_id ON shipments(carrier_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_id ON shipments(tracking_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payment_events_order_id ON payment_events(order_id);
`;

async function migrate() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  
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

  // Order & Payment tracking columns
  await pool.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS order_number VARCHAR(30)');
  await pool.query("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS order_status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED'");
  await pool.query("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'PAID'");
  await pool.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS distance_km NUMERIC(10,2) DEFAULT 0');
  await pool.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS pricing_breakdown JSONB');
  await pool.query("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS pricing_version VARCHAR(20) DEFAULT 'v1.0'");
  
  // Backfill order_number where null
  await pool.query("UPDATE shipments SET order_number = 'ORD-' || tracking_id WHERE order_number IS NULL");
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_shipments_order_number ON shipments(order_number)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_shipments_created_at_desc ON shipments(created_at DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_shipments_order_status ON shipments(order_status)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_shipments_payment_status ON shipments(payment_status)');
  
  // Drop and recreate status check constraint to support new statuses
  await pool.query('ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_status_check');
  await pool.query("ALTER TABLE shipments ADD CONSTRAINT shipments_status_check CHECK (status IN ('CREATED','ASSIGNED','PICKED_UP','ARRIVED_AT_HUB','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'))");
}

module.exports = { migrate };

