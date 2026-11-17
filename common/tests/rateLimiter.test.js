const request = require('supertest');
const express = require('express');
const { rateLimiter } = require('../src/rateLimiter');
const { errorHandler } = require('../src/errorHandler');

describe('rateLimiter', () => {
  it('sends rate-limit headers and returns 429 when limit exceeded', async () => {
    const app = express();
    app.use(rateLimiter({ windowMs: 10_000, max: 2, strictMax: true, enableInTest: true }));
    app.get('/test', (req, res) => res.json({ ok: true }));
    app.use(errorHandler('test-service'));

    // Request 1: success, remaining = 1
    const res1 = await request(app).get('/test');
    expect(res1.status).toBe(200);
    expect(res1.headers['ratelimit-limit']).toBe('2');
    expect(res1.headers['ratelimit-remaining']).toBe('1');

    // Request 2: success, remaining = 0
    const res2 = await request(app).get('/test');
    expect(res2.status).toBe(200);
    expect(res2.headers['ratelimit-remaining']).toBe('0');

    // Request 3: rate limit exceeded -> 429
    const res3 = await request(app).get('/test');
    expect(res3.status).toBe(429);
    expect(res3.body.error.code).toBe('TOO_MANY_REQUESTS');
    expect(res3.body.error.message).toMatch(/Too many requests/);
  });
});
