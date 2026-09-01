process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

jest.mock('../src/models/locationModel');

const request = require('supertest');
const { signAccessToken } = require('@shiptrack/common');
const locationModel = require('../src/models/locationModel');
const { buildApp } = require('../src/app');

const app = buildApp();
const adminToken = signAccessToken({ sub: 'admin-1', role: 'ADMIN' });
const customerToken = signAccessToken({ sub: 'cust-1', role: 'CUSTOMER' });

const usRow = { code: 'US', name: 'United States', capital: 'Washington, D.C.', currency: 'USD' };

beforeEach(() => jest.clearAllMocks());

describe('GET /api/v1/locations/countries', () => {
  test('is public', async () => {
    locationModel.listCountries.mockResolvedValue([usRow]);
    const res = await request(app).get('/api/v1/locations/countries');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ code: 'US', name: 'United States', capital: 'Washington, D.C.', currency: 'USD' }]);
  });
});

describe('GET /api/v1/locations/countries/:code', () => {
  test('returns 404 for an unknown code', async () => {
    locationModel.findCountry.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/locations/countries/ZZ');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/locations/countries', () => {
  test('requires admin', async () => {
    const res = await request(app)
      .post('/api/v1/locations/countries')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ code: 'MX', name: 'Mexico', capital: 'Mexico City', currency: 'MXN' });
    expect(res.status).toBe(403);
  });

  test('returns 409 for a duplicate country', async () => {
    locationModel.findCountry.mockResolvedValue(usRow);
    const res = await request(app)
      .post('/api/v1/locations/countries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'US', name: 'United States', capital: 'Washington, D.C.', currency: 'USD' });
    expect(res.status).toBe(409);
  });

  test('creates a new country as admin', async () => {
    locationModel.findCountry.mockResolvedValue(null);
    locationModel.createCountry.mockResolvedValue({
      code: 'MX', name: 'Mexico', capital: 'Mexico City', currency: 'MXN',
    });
    const res = await request(app)
      .post('/api/v1/locations/countries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'MX', name: 'Mexico', capital: 'Mexico City', currency: 'MXN' });
    expect(res.status).toBe(201);
    expect(res.body.code).toBe('MX');
  });
});

describe('GET /api/v1/locations/routes/lookup', () => {
  test('returns 404 when no route exists', async () => {
    locationModel.findRoute.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/locations/routes/lookup?origin=US&destination=ZZ');
    expect(res.status).toBe(404);
  });

  test('returns the route when found', async () => {
    locationModel.findRoute.mockResolvedValue({
      id: 1, origin_country: 'US', destination_country: 'CA', transit_days: 3,
    });
    const res = await request(app).get('/api/v1/locations/routes/lookup?origin=US&destination=CA');
    expect(res.status).toBe(200);
    expect(res.body.transitDays).toBe(3);
  });
});
