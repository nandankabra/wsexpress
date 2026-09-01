const { ApiError } = require('@shiptrack/common');
const locationModel = require('../models/locationModel');

function countryResponse(row) {
  return { code: row.code, name: row.name, capital: row.capital, currency: row.currency };
}

function cityResponse(row) {
  return { id: row.id, name: row.name, countryCode: row.country_code };
}

function warehouseResponse(row) {
  return { id: row.id, name: row.name, city: row.city, countryCode: row.country_code, address: row.address };
}

function routeResponse(row) {
  return { id: row.id, originCountry: row.origin_country, destinationCountry: row.destination_country, transitDays: row.transit_days };
}

async function listCountries() {
  const rows = await locationModel.listCountries();
  return rows.map(countryResponse);
}

async function getCountry(code) {
  const row = await locationModel.findCountry(code);
  if (!row) throw ApiError.notFound(`No country found for code ${code}`);
  return countryResponse(row);
}

async function createCountry(body) {
  const existing = await locationModel.findCountry(body.code);
  if (existing) throw ApiError.conflict(`Country ${body.code} already exists`);
  const row = await locationModel.createCountry(body);
  return countryResponse(row);
}

async function listCities(countryCode) {
  const rows = await locationModel.listCities(countryCode);
  return rows.map(cityResponse);
}

async function createCity(body) {
  const country = await locationModel.findCountry(body.countryCode);
  if (!country) throw ApiError.badRequest(`Unknown countryCode ${body.countryCode}`);
  const row = await locationModel.createCity(body);
  return cityResponse(row);
}

async function listWarehouses() {
  const rows = await locationModel.listWarehouses();
  return rows.map(warehouseResponse);
}

async function createWarehouse(body) {
  const country = await locationModel.findCountry(body.countryCode);
  if (!country) throw ApiError.badRequest(`Unknown countryCode ${body.countryCode}`);
  const row = await locationModel.createWarehouse(body);
  return warehouseResponse(row);
}

async function getRoute(origin, destination) {
  const row = await locationModel.findRoute(origin, destination);
  if (!row) throw ApiError.notFound(`No delivery route from ${origin} to ${destination}`);
  return routeResponse(row);
}

async function listRoutes() {
  const rows = await locationModel.listRoutes();
  return rows.map(routeResponse);
}

async function createRoute(body) {
  const existing = await locationModel.findRoute(body.originCountry, body.destinationCountry);
  if (existing) throw ApiError.conflict('Route already exists');
  const row = await locationModel.createRoute(body);
  return routeResponse(row);
}

module.exports = {
  listCountries, getCountry, createCountry,
  listCities, createCity,
  listWarehouses, createWarehouse,
  getRoute, listRoutes, createRoute,
};
