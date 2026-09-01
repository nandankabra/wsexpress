const locationService = require('../services/locationService');

async function listCountries(req, res, next) {
  try {
    res.status(200).json(await locationService.listCountries());
  } catch (err) {
    next(err);
  }
}

async function getCountry(req, res, next) {
  try {
    res.status(200).json(await locationService.getCountry(req.params.code));
  } catch (err) {
    next(err);
  }
}

async function createCountry(req, res, next) {
  try {
    res.status(201).json(await locationService.createCountry(req.body));
  } catch (err) {
    next(err);
  }
}

async function listCities(req, res, next) {
  try {
    res.status(200).json(await locationService.listCities(req.query.countryCode));
  } catch (err) {
    next(err);
  }
}

async function createCity(req, res, next) {
  try {
    res.status(201).json(await locationService.createCity(req.body));
  } catch (err) {
    next(err);
  }
}

async function listWarehouses(req, res, next) {
  try {
    res.status(200).json(await locationService.listWarehouses());
  } catch (err) {
    next(err);
  }
}

async function createWarehouse(req, res, next) {
  try {
    res.status(201).json(await locationService.createWarehouse(req.body));
  } catch (err) {
    next(err);
  }
}

async function getRoute(req, res, next) {
  try {
    res.status(200).json(await locationService.getRoute(req.query.origin, req.query.destination));
  } catch (err) {
    next(err);
  }
}

async function listRoutes(req, res, next) {
  try {
    res.status(200).json(await locationService.listRoutes());
  } catch (err) {
    next(err);
  }
}

async function createRoute(req, res, next) {
  try {
    res.status(201).json(await locationService.createRoute(req.body));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCountries, getCountry, createCountry,
  listCities, createCity,
  listWarehouses, createWarehouse,
  getRoute, listRoutes, createRoute,
};
