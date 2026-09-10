process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

jest.mock('../src/models/userModel');
jest.mock('../src/models/refreshTokenModel');
jest.mock('../src/models/verificationTokenModel');
jest.mock('../src/clients/crmClient');
jest.mock('../src/clients/notificationClient');

const request = require('supertest');
const userModel = require('../src/models/userModel');
const refreshTokenModel = require('../src/models/refreshTokenModel');
const verificationTokenModel = require('../src/models/verificationTokenModel');
const crmClient = require('../src/clients/crmClient');
const notificationClient = require('../src/clients/notificationClient');
const { buildApp } = require('../src/app');

const app = buildApp();

const existingUser = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password_hash: '$2a$10$abcdefghijklmnopqrstuv', 
  role: 'CUSTOMER',
  is_active: true,
  is_verified: true,
  created_at: new Date().toISOString(),
};

describe('POST /api/v1/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects an invalid body with 400', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  test('creates a CUSTOMER account, sends verification email, and records a CRM analytics event', async () => {
    userModel.findByEmail.mockResolvedValue(null);
    userModel.create.mockResolvedValue({ ...existingUser, id: 'new-id', is_verified: false });
    verificationTokenModel.createToken.mockResolvedValue();
    notificationClient.sendNotification.mockResolvedValue();
    crmClient.recordEvent.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Grace Hopper', email: 'grace@example.com', password: 'S3cretPW!' });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('CUSTOMER');
    expect(res.body.accessToken).toBeUndefined(); // no tokens until verified
    expect(userModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'grace@example.com', role: 'CUSTOMER', isVerified: false }),
    );
    expect(verificationTokenModel.createToken).toHaveBeenCalled();
    expect(notificationClient.sendNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'EMAIL_VERIFICATION', to: 'grace@example.com' }),
      expect.anything()
    );
    expect(crmClient.recordEvent).toHaveBeenCalledWith(
      'CUSTOMER_REGISTERED',
      expect.objectContaining({ entityId: 'new-id' }),
      expect.anything(),
    );
  });

  test('returns 409 when the email is already registered', async () => {
    userModel.findByEmail.mockResolvedValue(existingUser);
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ada', email: 'ada@example.com', password: 'S3cretPW!' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 401 for an unknown email', async () => {
    userModel.findByEmail.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever1' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('returns 401 for a wrong password', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('correct-password', 10);
    userModel.findByEmail.mockResolvedValue({ ...existingUser, password_hash: hash });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  test('returns 403 for an unverified email', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('correct-password', 10);
    userModel.findByEmail.mockResolvedValue({ ...existingUser, password_hash: hash, is_verified: false });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: 'correct-password' });
    expect(res.status).toBe(403);
    expect(res.body.error.message).toMatch(/verify your email/i);
  });

  test('logs in and returns tokens for correct credentials', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('correct-password', 10);
    userModel.findByEmail.mockResolvedValue({ ...existingUser, password_hash: hash });
    refreshTokenModel.store.mockResolvedValue();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: 'correct-password' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('ada@example.com');
    expect(res.body.accessToken).toBeDefined();
  });
});

describe('GET /api/v1/auth/me', () => {
  test('requires authentication', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/admin/accounts', () => {
  test('rejects non-admin callers with 403', async () => {
    const { signAccessToken } = require('@shiptrack/common');
    const token = signAccessToken({ sub: 'u1', role: 'CUSTOMER' });
    const res = await request(app)
      .post('/api/v1/auth/admin/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Carrier Co', email: 'carrier@example.com', password: 'S3cretPW!', role: 'CARRIER' });
    expect(res.status).toBe(403);
  });
});
