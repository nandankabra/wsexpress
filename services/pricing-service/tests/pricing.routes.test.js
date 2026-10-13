process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

jest.mock('../src/models/pricingModel');
jest.mock('../src/soap/countryClient');
jest.mock('../src/clients/locationClient');

const request = require('supertest');
const { signAccessToken } = require('@shiptrack/common');
const pricingModel = require('../src/models/pricingModel');
const countryClient = require('../src/soap/countryClient');
const locationClient = require('../src/clients/locationClient');
const { buildApp } = require('../src/app');

const app = buildApp();
const adminToken = signAccessToken({ sub: 'admin-1', role: 'ADMIN' });

const parcelRule = { package_type: 'PARCEL', base_rate: '5.00', per_kg_rate: '2.00', international_multiplier: '1.50' };
const usdRate = { currency: 'USD', rate_to_usd: '1.000000' };
const inrRate = { currency: 'INR', rate_to_usd: '0.012000' };

beforeEach(() => jest.clearAllMocks());

describe('POST /api/v1/pricing/quote', () => {
  test('prices a domestic shipment in USD using the SOAP country lookup + route lookup', async () => {
    pricingModel.findRule.mockResolvedValue(parcelRule);
    countryClient.getCountryInfo.mockResolvedValue({ code: 'US', name: 'United States', capital: 'DC', currency: 'USD' });
    locationClient.getRoute.mockResolvedValue({ transitDays: 2 });

    const res = await request(app)
      .post('/api/v1/pricing/quote')
      .send({ originCountry: 'US', destinationCountry: 'US', originCity: 'NYC', destinationCity: 'LA', weightKg: 2 });

    expect(res.status).toBe(200);
    expect(typeof res.body.priceAmount).toBe('number');
    expect(res.body.currency).toBe('USD');
    expect(res.body.estimatedDays).toBe(2);
  });

  test('prices an international shipment and converts to the requested currency', async () => {
    pricingModel.findRule.mockResolvedValue(parcelRule);
    countryClient.getCountryInfo.mockResolvedValue({ code: 'IN', name: 'India', capital: 'New Delhi', currency: 'INR' });
    pricingModel.findRate.mockImplementation((currency) =>
      Promise.resolve(currency === 'USD' ? usdRate : currency === 'INR' ? inrRate : null));
    locationClient.getRoute.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/pricing/quote')
      .send({ originCountry: 'US', destinationCountry: 'IN', originCity: 'NYC', destinationCity: 'DEL', weightKg: 1, currency: 'INR' });

    expect(res.status).toBe(200);
    expect(res.body.currency).toBe('INR');
    expect(typeof res.body.priceAmount).toBe('number');
    expect(res.body.estimatedDays).toBe(7); // fallback: no route found, international default
  });

  test('degrades to USD when the SOAP country lookup fails', async () => {
    pricingModel.findRule.mockResolvedValue(parcelRule);
    countryClient.getCountryInfo.mockRejectedValue(new Error('location-service unreachable'));
    locationClient.getRoute.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/pricing/quote')
      .send({ originCountry: 'US', destinationCountry: 'DE', weightKg: 1 });

    expect(res.status).toBe(200);
    expect(res.body.currency).toBe('USD');
  });

  test('prices a 1 kg parcel travelling ~1,000 km between New Delhi and Mumbai within ₹300-₹500 target', async () => {
    pricingModel.findRule.mockResolvedValue(parcelRule);
    countryClient.getCountryInfo.mockResolvedValue({ code: 'IN', currency: 'INR' });
    locationClient.getRoute.mockResolvedValue({ transitDays: 2 });

    const res = await request(app)
      .post('/api/v1/pricing/quote')
      .send({
        originCountry: 'IN',
        destinationCountry: 'IN',
        originCity: 'New Delhi',
        destinationCity: 'Mumbai',
        weightKg: 1,
        currency: 'INR',
      });

    expect(res.status).toBe(200);
    expect(res.body.currency).toBe('INR');
    expect(res.body.totalAmount).toBeGreaterThanOrEqual(300);
    expect(res.body.totalAmount).toBeLessThanOrEqual(500);
    expect(res.body.distanceKm).toBeGreaterThan(1000);
    expect(res.body.baseFare).toBeDefined();
    expect(res.body.distanceCharge).toBeDefined();
    expect(res.body.taxAmount).toBeDefined();
  });

  test('calculates volumetric dimensional weight when dimensions are provided', async () => {
    pricingModel.findRule.mockResolvedValue(parcelRule);
    countryClient.getCountryInfo.mockResolvedValue({ code: 'IN', currency: 'INR' });

    // 40 x 30 x 30 cm = 36,000 cm³ / 5000 = 7.2 kg volumetric weight
    const res = await request(app)
      .post('/api/v1/pricing/quote')
      .send({
        originCountry: 'IN',
        destinationCountry: 'IN',
        originCity: 'New Delhi',
        destinationCity: 'Mumbai',
        weightKg: 1,
        dimensionsCm: { length: 40, width: 30, height: 30 },
        currency: 'INR',
      });

    expect(res.status).toBe(200);
    expect(res.body.volumetricWeightKg).toBe(7.2);
    expect(res.body.chargeableWeightKg).toBe(7.2);
  });

  test('applies express service surcharge correctly', async () => {
    pricingModel.findRule.mockResolvedValue(parcelRule);
    countryClient.getCountryInfo.mockResolvedValue({ code: 'IN', currency: 'INR' });

    const standardRes = await request(app)
      .post('/api/v1/pricing/quote')
      .send({ originCountry: 'IN', destinationCountry: 'IN', originCity: 'New Delhi', destinationCity: 'Agra', weightKg: 1, serviceType: 'STANDARD', currency: 'INR' });

    const expressRes = await request(app)
      .post('/api/v1/pricing/quote')
      .send({ originCountry: 'IN', destinationCountry: 'IN', originCity: 'New Delhi', destinationCity: 'Agra', weightKg: 1, serviceType: 'EXPRESS', currency: 'INR' });

    expect(expressRes.status).toBe(200);
    expect(expressRes.body.totalAmount).toBeGreaterThan(standardRes.body.totalAmount);
    expect(expressRes.body.serviceSurcharge).toBeGreaterThan(0);
  });

  test('shorter distances yield lower distance charges than longer distances', async () => {
    pricingModel.findRule.mockResolvedValue(parcelRule);
    countryClient.getCountryInfo.mockResolvedValue({ code: 'IN', currency: 'INR' });

    const shortTrip = await request(app)
      .post('/api/v1/pricing/quote')
      .send({ originCountry: 'IN', destinationCountry: 'IN', originCity: 'New Delhi', destinationCity: 'Noida', weightKg: 1, currency: 'INR' });

    const longTrip = await request(app)
      .post('/api/v1/pricing/quote')
      .send({ originCountry: 'IN', destinationCountry: 'IN', originCity: 'New Delhi', destinationCity: 'Bengaluru', weightKg: 1, currency: 'INR' });

    expect(shortTrip.body.distanceCharge).toBeLessThan(longTrip.body.distanceCharge);
    expect(shortTrip.body.totalAmount).toBeLessThan(longTrip.body.totalAmount);
  });

  test('rejects an invalid body', async () => {
    const res = await request(app).post('/api/v1/pricing/quote').send({ weightKg: 1 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/pricing/config & PUT /api/v1/pricing/config', () => {
  test('returns current active pricing configuration', async () => {
    const res = await request(app).get('/api/v1/pricing/config');
    expect(res.status).toBe(200);
    expect(res.body.configVersion).toBeDefined();
    expect(res.body.distanceRatePerKm).toBeDefined();
    expect(res.body.baseHandlingFare).toBeDefined();
  });

  test('rejects config update from non-admin with 401', async () => {
    const res = await request(app)
      .put('/api/v1/pricing/config')
      .send({ baseHandlingFare: 75 });
    expect(res.status).toBe(401);
  });

  test('updates pricing config for admin and increments version', async () => {
    const res = await request(app)
      .put('/api/v1/pricing/config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ baseHandlingFare: 70, distanceRatePerKm: 0.30 });

    expect(res.status).toBe(200);
    expect(res.body.updatedConfig.baseHandlingFare).toBe(70);
    expect(res.body.updatedConfig.distanceRatePerKm).toBe(0.30);
  });
});

describe('POST /api/v1/pricing/convert', () => {
  test('returns 400 for an unknown currency', async () => {
    pricingModel.findRate.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/v1/pricing/convert')
      .send({ amount: 10, fromCurrency: 'USD', toCurrency: 'ZZZ' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/v1/pricing/rules', () => {
  test('requires admin', async () => {
    const res = await request(app)
      .put('/api/v1/pricing/rules')
      .send({ packageType: 'PARCEL', baseRate: 6, perKgRate: 2 });
    expect(res.status).toBe(401);
  });

  test('upserts a rule for admins', async () => {
    pricingModel.upsertRule.mockResolvedValue({ ...parcelRule, base_rate: '6.00' });
    const res = await request(app)
      .put('/api/v1/pricing/rules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ packageType: 'PARCEL', baseRate: 6, perKgRate: 2 });
    expect(res.status).toBe(200);
    expect(res.body.baseRate).toBe(6);
  });
});

