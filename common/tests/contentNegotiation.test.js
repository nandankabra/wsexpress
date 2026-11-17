const request = require('supertest');
const { createBaseApp } = require('../src/baseApp');

describe('contentNegotiation', () => {
  it('returns JSON by default or when Accept is application/json', async () => {
    const { app } = createBaseApp('test-service');
    app.get('/test', (req, res) => res.json({ name: 'ShipTrack', count: 42 }));

    const res = await request(app).get('/test').set('Accept', 'application/json');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ name: 'ShipTrack', count: 42 });
  });

  it('returns XML when Accept is application/xml', async () => {
    const { app } = createBaseApp('test-service');
    app.get('/test', (req, res) => res.json({ name: 'ShipTrack', count: 42 }));

    const res = await request(app).get('/test').set('Accept', 'application/xml');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/xml/);
    expect(res.text).toContain('<name>ShipTrack</name>');
    expect(res.text).toContain('<count>42</count>');
  });
});
