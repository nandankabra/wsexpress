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

  test('rejects an invalid body', async () => {
    const res = await request(app).post('/api/v1/pricing/quote').send({ weightKg: 1 });
    expect(res.status).toBe(400);
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
