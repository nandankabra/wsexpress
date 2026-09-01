const express = require('express');
const request = require('supertest');
const { validate } = require('../src/validate');
const { errorHandler } = require('../src/errorHandler');

const schema = {
  type: 'object',
  required: ['name', 'weightKg'],
  properties: {
    name: { type: 'string', minLength: 1 },
    weightKg: { type: 'number', minimum: 0.01 },
  },
  additionalProperties: true,
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.post('/things', validate(schema), (req, res) => res.status(201).json({ ok: true }));
  app.use(errorHandler('test-service'));
  return app;
}

describe('validate middleware', () => {
  test('rejects a body missing required fields', async () => {
    const res = await request(buildApp()).post('/things').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  test('accepts a valid body', async () => {
    const res = await request(buildApp()).post('/things').send({ name: 'box', weightKg: 2.5 });
    expect(res.status).toBe(201);
  });
});
