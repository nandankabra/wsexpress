const { pool } = require('../db/pool');

async function listCountries() {
  const [rows] = await pool.query('SELECT * FROM countries ORDER BY name');
  return rows;
}

async function findCountry(code) {
  const [rows] = await pool.query('SELECT * FROM countries WHERE code = ?', [code.toUpperCase()]);
  return rows[0] || null;
}

async function createCountry({ code, name, capital, currency }) {
  await pool.query('INSERT INTO countries (code, name, capital, currency) VALUES (?, ?, ?, ?)', [
    code.toUpperCase(), name, capital, currency.toUpperCase(),
  ]);
  return findCountry(code);
}

async function listCities(countryCode) {
  if (countryCode) {
    const [rows] = await pool.query('SELECT * FROM cities WHERE country_code = ? ORDER BY name', [
      countryCode.toUpperCase(),
    ]);
    return rows;
  }
  const [rows] = await pool.query('SELECT * FROM cities ORDER BY name');
  return rows;
}

async function createCity({ name, countryCode }) {
  const [result] = await pool.query('INSERT INTO cities (name, country_code) VALUES (?, ?)', [
    name, countryCode.toUpperCase(),
  ]);
  return { id: result.insertId, name, country_code: countryCode.toUpperCase() };
}

async function listWarehouses() {
  const [rows] = await pool.query('SELECT * FROM warehouses ORDER BY name');
  return rows;
}

async function createWarehouse({ name, city, countryCode, address }) {
  const [result] = await pool.query(
    'INSERT INTO warehouses (name, city, country_code, address) VALUES (?, ?, ?, ?)',
    [name, city, countryCode.toUpperCase(), address],
  );
  return { id: result.insertId, name, city, country_code: countryCode.toUpperCase(), address };
}

async function findRoute(originCountry, destinationCountry) {
  const [rows] = await pool.query(
    'SELECT * FROM delivery_routes WHERE origin_country = ? AND destination_country = ?',
    [originCountry.toUpperCase(), destinationCountry.toUpperCase()],
  );
  return rows[0] || null;
}

async function listRoutes() {
  const [rows] = await pool.query('SELECT * FROM delivery_routes ORDER BY origin_country, destination_country');
  return rows;
}

async function createRoute({ originCountry, destinationCountry, transitDays }) {
  await pool.query(
    'INSERT INTO delivery_routes (origin_country, destination_country, transit_days) VALUES (?, ?, ?)',
    [originCountry.toUpperCase(), destinationCountry.toUpperCase(), transitDays],
  );
  return findRoute(originCountry, destinationCountry);
}

module.exports = {
  listCountries, findCountry, createCountry,
  listCities, createCity,
  listWarehouses, createWarehouse,
  findRoute, listRoutes, createRoute,
};
