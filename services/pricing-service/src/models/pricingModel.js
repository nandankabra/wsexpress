const { pool } = require('../db/pool');

async function findRule(packageType) {
  const [rows] = await pool.query('SELECT * FROM pricing_rules WHERE package_type = ?', [packageType]);
  return rows[0] || null;
}

async function listRules() {
  const [rows] = await pool.query('SELECT * FROM pricing_rules ORDER BY package_type');
  return rows;
}

async function upsertRule({ packageType, baseRate, perKgRate, internationalMultiplier }) {
  await pool.query(
    `INSERT INTO pricing_rules (package_type, base_rate, per_kg_rate, international_multiplier)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE base_rate = VALUES(base_rate), per_kg_rate = VALUES(per_kg_rate),
       international_multiplier = VALUES(international_multiplier)`,
    [packageType, baseRate, perKgRate, internationalMultiplier || 1.5],
  );
  return findRule(packageType);
}

async function findRate(currency) {
  const [rows] = await pool.query('SELECT * FROM currency_rates WHERE currency = ?', [currency]);
  return rows[0] || null;
}

async function listRates() {
  const [rows] = await pool.query('SELECT * FROM currency_rates ORDER BY currency');
  return rows;
}

module.exports = { findRule, listRules, upsertRule, findRate, listRates };
