const express = require('express');
const request = require('supertest');
const { idempotency } = require('../src/idempotency');
const { errorHandler } = require('../src/errorHandler');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(idempotency());
  let counter = 0;
  app.post('/orders', (req, res) => {
    counter += 1;
    res.status(201).json({ orderId: counter });
  });
  app.use(errorHandler('test-service'));
  return app;
}

describe('idempotency middleware', () => {
  test('replays the cached response for a repeated key', async () => {
    const app = buildApp();
    const key = 'abc-123';
    const first = await request(app).post('/orders').set('Idempotency-Key', key).send({ item: 'x' });
    const second = await request(app).post('/orders').set('Idempotency-Key', key).send({ item: 'x' });
    expect(first.body.orderId).toBe(1);
    expect(second.body.orderId).toBe(1);
    expect(second.headers['idempotent-replay']).toBe('true');
  });

  test('executes normally without a key', async () => {
    const app = buildApp();
    const first = await request(app).post('/orders').send({ item: 'x' });
    const second = await request(app).post('/orders').send({ item: 'x' });
    expect(first.body.orderId).toBe(1);
    expect(second.body.orderId).toBe(2);
  });

  test('rejects a reused key with a different body', async () => {
    const app = buildApp();
    const key = 'reuse-1';
    await request(app).post('/orders').set('Idempotency-Key', key).send({ item: 'x' });
    const res = await request(app).post('/orders').set('Idempotency-Key', key).send({ item: 'y' });
    expect(res.status).toBe(409);
  });
});
