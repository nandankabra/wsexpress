process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

jest.mock('../src/models/analyticsEventModel');

const request = require('supertest');
const { signAccessToken } = require('@shiptrack/common');
const analyticsEventModel = require('../src/models/analyticsEventModel');
const { buildApp } = require('../src/app');

const app = buildApp();
const adminToken = signAccessToken({ sub: 'admin-1', role: 'ADMIN' });
const customerToken = signAccessToken({ sub: 'cust-1', role: 'CUSTOMER' });

beforeEach(() => jest.clearAllMocks());

describe('POST /api/v1/crm/events', () => {
  test('validates eventType', async () => {
    const res = await request(app).post('/api/v1/crm/events').send({ eventType: 'BOGUS', entityId: 'x' });
    expect(res.status).toBe(400);
  });

  test('records a valid event without auth', async () => {
    analyticsEventModel.create.mockResolvedValue({
      _id: '65a000000000000000000001', eventType: 'SHIPMENT_CREATED', entityId: 'ship-1', timestamp: new Date(),
    });
    const res = await request(app)
      .post('/api/v1/crm/events')
      .send({ eventType: 'SHIPMENT_CREATED', entityId: 'ship-1', customerId: 'cust-1' });
    expect(res.status).toBe(201);
  });
});

describe('GET /api/v1/crm/summary', () => {
  test('is admin-only', async () => {
    const res = await request(app).get('/api/v1/crm/summary').set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  test('computes counts and delivery rate', async () => {
    analyticsEventModel.countByEventType.mockResolvedValue([
      { _id: 'SHIPMENT_CREATED', count: 10 },
      { _id: 'SHIPMENT_DELIVERED', count: 4 },
    ]);
    const res = await request(app).get('/api/v1/crm/summary').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.counts.SHIPMENT_CREATED).toBe(10);
    expect(res.body.deliveryRate).toBe(0.4);
  });
});

describe('GET /api/v1/crm/customers/top', () => {
  test('returns top customers for admins', async () => {
    analyticsEventModel.topCustomersByShipments.mockResolvedValue([{ _id: 'cust-1', shipmentCount: 5 }]);
    const res = await request(app).get('/api/v1/crm/customers/top').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body[0]).toEqual({ customerId: 'cust-1', shipmentCount: 5 });
  });
});
