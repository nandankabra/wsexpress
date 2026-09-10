process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

jest.mock('../src/models/trackingEventModel');

const request = require('supertest');
const { signAccessToken } = require('@shiptrack/common');
const trackingEventModel = require('../src/models/trackingEventModel');
const { buildApp } = require('../src/app');

const app = buildApp();
const carrierToken = signAccessToken({ sub: 'carrier-1', role: 'CARRIER' });

const eventDoc = {
  _id: '65a000000000000000000001',
  trackingId: 'STKABC123',
  status: 'CREATED',
  location: 'NYC',
  note: 'Shipment created',
  recordedBy: 'system',
  timestamp: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

describe('POST /api/v1/tracking/:trackingId/events', () => {
  test('validates the status enum', async () => {
    const res = await request(app)
      .post('/api/v1/tracking/STKABC123/events')
      .send({ status: 'NOT_A_STATUS' });
    expect(res.status).toBe(400);
  });

  test('records an event without authentication (internal service call)', async () => {
    trackingEventModel.create.mockResolvedValue(eventDoc);
    const res = await request(app)
      .post('/api/v1/tracking/STKABC123/events')
      .send({ status: 'CREATED', location: 'NYC', note: 'Shipment created' });
    expect(res.status).toBe(201);
    expect(res.body.recordedBy).toBe('system');
    expect(trackingEventModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ trackingId: 'STKABC123', recordedBy: 'SYSTEM' }),
    );
  });

  test('records recordedBy from an authenticated carrier', async () => {
    trackingEventModel.create.mockResolvedValue({ ...eventDoc, recordedBy: 'CARRIER_carrier-' });
    const res = await request(app)
      .post('/api/v1/tracking/STKABC123/events')
      .set('Authorization', `Bearer ${carrierToken}`)
      .send({ status: 'PICKED_UP' });
    expect(res.status).toBe(201);
    expect(trackingEventModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ recordedBy: 'CARRIER_carrier-' }),
    );
  });
});

describe('GET /api/v1/tracking/:trackingId/events', () => {
  test('is public and returns a paginated list', async () => {
    trackingEventModel.listByTrackingId.mockResolvedValue([eventDoc]);
    const res = await request(app).get('/api/v1/tracking/STKABC123/events');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('CREATED');
  });
});

describe('GET /api/v1/tracking/:trackingId/latest', () => {
  test('returns 404 when there are no events yet', async () => {
    trackingEventModel.findLatest.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/tracking/UNKNOWN/latest');
    expect(res.status).toBe(404);
  });

  test('returns the most recent event', async () => {
    trackingEventModel.findLatest.mockResolvedValue(eventDoc);
    const res = await request(app).get('/api/v1/tracking/STKABC123/latest');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CREATED');
  });
});
