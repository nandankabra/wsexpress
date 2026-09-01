const express = require('express');
const request = require('supertest');
const { etag } = require('../src/etag');

function buildApp() {
  const app = express();
  app.get('/resource', etag(), (req, res) => res.json({ id: 1, name: 'box' }));
  return app;
}

describe('etag middleware', () => {
  test('sets an ETag header on GET', async () => {
    const res = await request(buildApp()).get('/resource');
    expect(res.status).toBe(200);
    expect(res.headers.etag).toBeDefined();
  });

  test('returns 304 when If-None-Match matches', async () => {
    const app = buildApp();
    const first = await request(app).get('/resource');
    const second = await request(app).get('/resource').set('If-None-Match', first.headers.etag);
    expect(second.status).toBe(304);
  });
});
