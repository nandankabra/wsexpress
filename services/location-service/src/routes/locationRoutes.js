const express = require('express');
const { validate, authenticate, requireRole, etag, cacheControl } = require('@shiptrack/common');
const controller = require('../controllers/locationController');
const schemas = require('../middleware/schemas');

const router = express.Router();

router.get('/countries', cacheControl(300), controller.listCountries);
router.get('/countries/:code', etag(), cacheControl(300), controller.getCountry);
router.post('/countries', authenticate, requireRole('ADMIN'), validate(schemas.createCountrySchema), controller.createCountry);

router.get('/cities', cacheControl(300), controller.listCities);
router.post('/cities', authenticate, requireRole('ADMIN'), validate(schemas.createCitySchema), controller.createCity);

router.get('/warehouses', cacheControl(300), controller.listWarehouses);
router.post('/warehouses', authenticate, requireRole('ADMIN'), validate(schemas.createWarehouseSchema), controller.createWarehouse);

router.get('/routes', cacheControl(300), controller.listRoutes);
router.get('/routes/lookup', cacheControl(300), controller.getRoute);
router.post('/routes', authenticate, requireRole('ADMIN'), validate(schemas.createRouteSchema), controller.createRoute);

module.exports = router;
