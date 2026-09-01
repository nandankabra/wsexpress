process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

jest.mock('../src/models/profileModel');

const request = require('supertest');
const { signAccessToken } = require('@shiptrack/common');
const profileModel = require('../src/models/profileModel');
const { buildApp } = require('../src/app');

const app = buildApp();
const customerToken = signAccessToken({ sub: 'user-1', role: 'CUSTOMER' });
const adminToken = signAccessToken({ sub: 'admin-1', role: 'ADMIN' });

const dbRow = {
  user_id: 'user-1',
  full_name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: null,
  address_line1: null,
  address_line2: null,
  city: null,
  state: null,
  postal_code: null,
  country: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/v1/customers/me', () => {
  test('requires authentication', async () => {
    const res = await request(app).get('/api/v1/customers/me');
    expect(res.status).toBe(401);
  });

  test('rejects non-customer roles', async () => {
    const res = await request(app).get('/api/v1/customers/me').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });

  test('returns 404 when no profile exists yet', async () => {
    profileModel.findByUserId.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/customers/me').set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(404);
  });

  test('returns the profile when it exists', async () => {
    profileModel.findByUserId.mockResolvedValue(dbRow);
    const res = await request(app).get('/api/v1/customers/me').set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('Ada Lovelace');
  });
});

describe('PUT /api/v1/customers/me', () => {
  test('validates the body', async () => {
    const res = await request(app)
      .put('/api/v1/customers/me')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test('upserts the profile', async () => {
    profileModel.upsert.mockResolvedValue(dbRow);
    const res = await request(app)
      .put('/api/v1/customers/me')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ fullName: 'Ada Lovelace', email: 'ada@example.com' });
    expect(res.status).toBe(200);
    expect(profileModel.upsert).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ fullName: 'Ada Lovelace' }),
    );
  });
});

describe('GET /api/v1/customers', () => {
  test('is admin-only', async () => {
    const res = await request(app).get('/api/v1/customers').set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  test('returns a paginated list for admins', async () => {
    profileModel.listPage.mockResolvedValue([dbRow]);
    const res = await request(app).get('/api/v1/customers').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.hasMore).toBe(false);
  });
});
