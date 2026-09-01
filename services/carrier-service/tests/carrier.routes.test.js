process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

jest.mock('../src/models/carrierModel');
jest.mock('../src/clients/crmClient');

const request = require('supertest');
const { signAccessToken } = require('@shiptrack/common');
const carrierModel = require('../src/models/carrierModel');
const crmClient = require('../src/clients/crmClient');
const { buildApp } = require('../src/app');

const app = buildApp();
const carrierToken = signAccessToken({ sub: 'carrier-1', role: 'CARRIER' });
const adminToken = signAccessToken({ sub: 'admin-1', role: 'ADMIN' });

const dbRow = {
  user_id: 'carrier-1',
  company_name: 'Swift Logistics',
  contact_email: 'ops@swift.example',
  contact_phone: null,
  vehicle_type: 'Van',
  license_number: 'LIC-1',
  service_areas: 'NYC,SF',
  is_verified: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

describe('carrier self-service', () => {
  test('GET /me requires the CARRIER role', async () => {
    const res = await request(app).get('/api/v1/carriers/me').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });

  test('PUT /me upserts the carrier profile', async () => {
    carrierModel.upsert.mockResolvedValue(dbRow);
    const res = await request(app)
      .put('/api/v1/carriers/me')
      .set('Authorization', `Bearer ${carrierToken}`)
      .send({ companyName: 'Swift Logistics', contactEmail: 'ops@swift.example' });
    expect(res.status).toBe(200);
    expect(res.body.companyName).toBe('Swift Logistics');
  });
});

describe('admin carrier management', () => {
  test('PATCH /:userId/verify verifies a carrier and records a CRM analytics event', async () => {
    carrierModel.setVerified.mockResolvedValue({ ...dbRow, is_verified: true });
    crmClient.recordEvent.mockResolvedValue(null);
    const res = await request(app)
      .patch('/api/v1/carriers/carrier-1/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isVerified: true });
    expect(res.status).toBe(200);
    expect(res.body.isVerified).toBe(true);
    expect(crmClient.recordEvent).toHaveBeenCalledWith(
      'CARRIER_VERIFIED',
      expect.objectContaining({ entityId: 'carrier-1' }),
      expect.anything(),
    );
  });

  test('PATCH /:userId/verify does not record an event when unverifying', async () => {
    carrierModel.setVerified.mockResolvedValue({ ...dbRow, is_verified: false });
    const res = await request(app)
      .patch('/api/v1/carriers/carrier-1/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isVerified: false });
    expect(res.status).toBe(200);
    expect(crmClient.recordEvent).not.toHaveBeenCalled();
  });

  test('PATCH /:userId/verify returns 404 for an unknown carrier', async () => {
    carrierModel.setVerified.mockResolvedValue(null);
    const res = await request(app)
      .patch('/api/v1/carriers/unknown/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isVerified: true });
    expect(res.status).toBe(404);
  });

  test('GET / lists carriers for admins only', async () => {
    carrierModel.listPage.mockResolvedValue([dbRow]);
    const res = await request(app).get('/api/v1/carriers').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});
