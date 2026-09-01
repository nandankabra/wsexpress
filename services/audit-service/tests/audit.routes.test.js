process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

jest.mock('../src/models/auditLogModel');

const request = require('supertest');
const { signAccessToken } = require('@shiptrack/common');
const auditLogModel = require('../src/models/auditLogModel');
const { buildApp } = require('../src/app');

const app = buildApp();
const adminToken = signAccessToken({ sub: 'admin-1', role: 'ADMIN' });
const customerToken = signAccessToken({ sub: 'cust-1', role: 'CUSTOMER' });

beforeEach(() => jest.clearAllMocks());

describe('POST /api/v1/audit/logs', () => {
  test('validates required fields', async () => {
    const res = await request(app).post('/api/v1/audit/logs').send({ action: 'LOGIN_FAILED' });
    expect(res.status).toBe(400);
  });

  test('records a log entry without auth', async () => {
    auditLogModel.create.mockResolvedValue({
      _id: '65a000000000000000000001', action: 'LOGIN_FAILED', service: 'auth-service',
      severity: 'SECURITY', timestamp: new Date(),
    });
    const res = await request(app)
      .post('/api/v1/audit/logs')
      .send({ action: 'LOGIN_FAILED', service: 'auth-service', severity: 'SECURITY' });
    expect(res.status).toBe(201);
    expect(res.body.severity).toBe('SECURITY');
  });
});

describe('GET /api/v1/audit/logs', () => {
  test('requires admin', async () => {
    const res = await request(app).get('/api/v1/audit/logs').set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  test('returns a paginated list for admins', async () => {
    auditLogModel.listPage.mockResolvedValue([
      { _id: '65a000000000000000000001', action: 'LOGIN_FAILED', service: 'auth-service', severity: 'SECURITY', timestamp: new Date() },
    ]);
    const res = await request(app).get('/api/v1/audit/logs').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});
