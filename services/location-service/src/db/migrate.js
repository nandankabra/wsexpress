const { pool } = require('./pool');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS countries (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  capital VARCHAR(100) NOT NULL,
  currency VARCHAR(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS cities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  country_code VARCHAR(2) NOT NULL,
  FOREIGN KEY (country_code) REFERENCES countries(code)
);

CREATE TABLE IF NOT EXISTS warehouses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country_code VARCHAR(2) NOT NULL,
  address VARCHAR(200) NOT NULL,
  FOREIGN KEY (country_code) REFERENCES countries(code)
);

CREATE TABLE IF NOT EXISTS delivery_routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  origin_country VARCHAR(2) NOT NULL,
  destination_country VARCHAR(2) NOT NULL,
  transit_days INT NOT NULL,
  UNIQUE KEY uniq_route (origin_country, destination_country),
  FOREIGN KEY (origin_country) REFERENCES countries(code),
  FOREIGN KEY (destination_country) REFERENCES countries(code)
);
`;

const SEED_COUNTRIES = [
  ['US', 'United States', 'Washington, D.C.', 'USD'],
  ['IN', 'India', 'New Delhi', 'INR'],
  ['GB', 'United Kingdom', 'London', 'GBP'],
  ['CA', 'Canada', 'Ottawa', 'CAD'],
  ['AU', 'Australia', 'Canberra', 'AUD'],
  ['DE', 'Germany', 'Berlin', 'EUR'],
  ['FR', 'France', 'Paris', 'EUR'],
  ['JP', 'Japan', 'Tokyo', 'JPY'],
  ['CN', 'China', 'Beijing', 'CNY'],
  ['BR', 'Brazil', 'Brasília', 'BRL'],
];

const SEED_ROUTES = [
  ['US', 'US', 2], ['US', 'CA', 3], ['US', 'GB', 6], ['US', 'IN', 8],
  ['IN', 'US', 8], ['IN', 'GB', 6], ['IN', 'AU', 7],
  ['GB', 'DE', 3], ['GB', 'FR', 2], ['DE', 'FR', 2],
];

async function migrate() {
  const statements = SCHEMA.split(';').map((s) => s.trim()).filter(Boolean);
  for (const statement of statements) {
    await pool.query(statement);
  }

  const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM countries');
  if (count === 0) {
    for (const row of SEED_COUNTRIES) {
      await pool.query('INSERT INTO countries (code, name, capital, currency) VALUES (?, ?, ?, ?)', row);
    }
    for (const row of SEED_ROUTES) {
      await pool.query(
        'INSERT INTO delivery_routes (origin_country, destination_country, transit_days) VALUES (?, ?, ?)',
        row,
      );
    }
  }
}

module.exports = { migrate };
