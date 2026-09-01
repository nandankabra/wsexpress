process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const express = require('express');
const request = require('supertest');
const {
  signAccessToken,
  verifyAccessToken,
  hashPassword,
  comparePassword,
  authenticate,
  requireRole,
} = require('../src/auth');
const { errorHandler } = require('../src/errorHandler');

describe('auth', () => {
  test('signs and verifies an access token', () => {
    const token = signAccessToken({ sub: 'user-1', role: 'CUSTOMER' });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.role).toBe('CUSTOMER');
  });

  test('hashes and compares a password', async () => {
    const hash = await hashPassword('S3cret!');
    expect(await comparePassword('S3cret!', hash)).toBe(true);
    expect(await comparePassword('wrong', hash)).toBe(false);
  });

  function buildApp() {
    const app = express();
    app.get('/protected', authenticate, requireRole('ADMIN'), (req, res) => res.json({ ok: true }));
    app.use(errorHandler('test-service'));
    return app;
  }

  test('rejects requests with no bearer token', async () => {
    const res = await request(buildApp()).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('rejects requests with the wrong role', async () => {
    const token = signAccessToken({ sub: 'u1', role: 'CUSTOMER' });
    const res = await request(buildApp()).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('allows requests with the correct role', async () => {
    const token = signAccessToken({ sub: 'u1', role: 'ADMIN' });
    const res = await request(buildApp()).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
