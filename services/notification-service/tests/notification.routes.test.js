process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

jest.mock('../src/services/mailer');

const request = require('supertest');
const { signAccessToken } = require('@shiptrack/common');
const mailer = require('../src/services/mailer');
const { buildApp } = require('../src/app');

const app = buildApp();
const adminToken = signAccessToken({ sub: 'admin-1', role: 'ADMIN' });

beforeEach(() => jest.clearAllMocks());

describe('POST /api/v1/notifications/send', () => {
  test('rejects an invalid email', async () => {
    const res = await request(app).post('/api/v1/notifications/send').send({ to: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  test('renders a templated shipment-update email and sends it', async () => {
    mailer.sendMail.mockResolvedValue({ messageId: 'msg-1' });
    const res = await request(app)
      .post('/api/v1/notifications/send')
      .send({ to: 'ada@example.com', type: 'SHIPMENT_UPDATE', data: { trackingId: 'STK1', status: 'IN_TRANSIT' } });

    expect(res.status).toBe(201);
    expect(mailer.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'ada@example.com', subject: expect.stringContaining('STK1') }),
    );
  });
});

describe('GET /api/v1/notifications', () => {
  test('requires admin', async () => {
    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(401);
  });

  test('returns recent history for admins after a send', async () => {
    mailer.sendMail.mockResolvedValue({ messageId: 'msg-2' });
    await request(app).post('/api/v1/notifications/send').send({ to: 'ada@example.com', subject: 'Hi', message: 'Hello' });

    const res = await request(app).get('/api/v1/notifications').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
