const { pool } = require('./pool');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS pricing_rules (
  package_type VARCHAR(20) PRIMARY KEY,
  base_rate DECIMAL(10,2) NOT NULL,
  per_kg_rate DECIMAL(10,2) NOT NULL,
  international_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.50,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS currency_rates (
  currency VARCHAR(3) PRIMARY KEY,
  rate_to_usd DECIMAL(14,6) NOT NULL
);
`;

const SEED_RULES = [
  ['PARCEL', 5.0, 2.0, 1.5],
  ['DOCUMENT', 3.0, 0.5, 1.3],
  ['PALLET', 20.0, 1.5, 1.6],
  ['FREIGHT', 50.0, 1.0, 1.7],
];

const SEED_RATES = [
  ['USD', 1.0], ['INR', 0.012], ['GBP', 1.27], ['EUR', 1.08],
  ['CAD', 0.73], ['AUD', 0.66], ['JPY', 0.0067], ['CNY', 0.14], ['BRL', 0.17],
];

async function migrate() {
  const statements = SCHEMA.split(';').map((s) => s.trim()).filter(Boolean);
  for (const statement of statements) {
    await pool.query(statement);
  }

  const [[{ count: ruleCount }]] = await pool.query('SELECT COUNT(*) as count FROM pricing_rules');
  if (ruleCount === 0) {
    for (const row of SEED_RULES) {
      await pool.query(
        'INSERT INTO pricing_rules (package_type, base_rate, per_kg_rate, international_multiplier) VALUES (?, ?, ?, ?)',
        row,
      );
    }
  }

  const [[{ count: rateCount }]] = await pool.query('SELECT COUNT(*) as count FROM currency_rates');
  if (rateCount === 0) {
    for (const row of SEED_RATES) {
      await pool.query('INSERT INTO currency_rates (currency, rate_to_usd) VALUES (?, ?)', row);
    }
  }
}

module.exports = { migrate };
