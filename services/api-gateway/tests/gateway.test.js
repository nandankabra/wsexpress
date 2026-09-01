process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

const http = require('http');
const request = require('supertest');
const { signAccessToken } = require('@shiptrack/common');

let fakeAuthService;

function startFakeUpstream() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            receivedPath: req.url,
            correlationId: req.headers['x-correlation-id'] || null,
            userId: req.headers['x-user-id'] || null,
            userRole: req.headers['x-user-role'] || null,
          }),
        );
      });
    });
    server.listen(0, () => resolve(server));
  });
}

beforeAll(async () => {
  fakeAuthService = await startFakeUpstream();
  process.env.AUTH_SERVICE_URL = `http://127.0.0.1:${fakeAuthService.address().port}`;
  // Point everything else at a closed port so those routes are configured but unreachable.
  const closedTarget = 'http://127.0.0.1:65535';
  process.env.USER_SERVICE_URL = closedTarget;
  process.env.CARRIER_SERVICE_URL = closedTarget;
  process.env.SHIPMENT_SERVICE_URL = closedTarget;
  process.env.TRACKING_SERVICE_URL = closedTarget;
  process.env.PRICING_SERVICE_URL = closedTarget;
  process.env.LOCATION_SERVICE_URL = closedTarget;
  process.env.CRM_SERVICE_URL = closedTarget;
  process.env.AUDIT_SERVICE_URL = closedTarget;
  process.env.NOTIFICATION_SERVICE_URL = closedTarget;
  process.env.GRAPHQL_SERVICE_URL = closedTarget;
});

afterAll(() => {
  fakeAuthService.close();
});

describe('GET /health', () => {
  test('reports UP without hitting any upstream', async () => {
    const { buildApp } = require('../src/app');
    const res = await request(buildApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
  });
});

describe('gateway JWT validation', () => {
  test('rejects a malformed bearer token before proxying', async () => {
    const { buildApp } = require('../src/app');
    const res = await request(buildApp())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not-a-real-jwt');
    expect(res.status).toBe(401);
  });

  test('allows requests with no token through as a guest, proxied to the upstream', async () => {
    const { buildApp } = require('../src/app');
    const res = await request(buildApp()).get('/api/v1/auth/register');
    expect(res.status).toBe(200);
    expect(res.body.receivedPath).toBe('/api/v1/auth/register');
    expect(res.body.correlationId).toBeTruthy();
    expect(res.body.userId).toBeNull();
  });

  test('forwards decoded identity headers for a valid token', async () => {
    const { buildApp } = require('../src/app');
    const token = signAccessToken({ sub: 'user-1', role: 'ADMIN' });
    const res = await request(buildApp())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('user-1');
    expect(res.body.userRole).toBe('ADMIN');
  });
});

describe('proxy resilience', () => {
  test('returns a JSON 503 when the upstream service is unreachable', async () => {
    const { buildApp } = require('../src/app');
    const res = await request(buildApp()).get('/api/v1/shipments/track/STK123');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
  }, 10000);
});

describe('unconfigured routes', () => {
  test('falls through to 404 for a path with no route mapping', async () => {
    const { buildApp } = require('../src/app');
    const res = await request(buildApp()).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
  });
});
