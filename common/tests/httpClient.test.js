const http = require('http');
const { createServiceClient } = require('../src/httpClient');
const { ApiError } = require('../src/errors');

function startServer(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, () => resolve(server));
  });
}

describe('createServiceClient', () => {
  let server;

  afterEach(() => {
    if (server) server.close();
  });

  test('resolves to the unwrapped response body on success', async () => {
    server = await startServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ hello: 'world' }));
    });
    const client = createServiceClient({ baseURL: `http://127.0.0.1:${server.address().port}`, name: 'test' });

    const result = await client.get('/thing', 'corr-1');
    expect(result).toEqual({ hello: 'world' });
  });

  test('a custom fallback returning a plain value (e.g. null) does not throw', async () => {
    server = await startServer((req, res) => {
      res.writeHead(500);
      res.end('boom');
    });
    const client = createServiceClient({
      baseURL: `http://127.0.0.1:${server.address().port}`,
      name: 'test',
      timeout: 200,
      fallback: () => null,
    });

    // Previously this threw "Cannot read properties of null (reading 'data')" because the
    // fallback's raw return value was being treated as an Axios response and unwrapped again.
    await expect(client.get('/thing', 'corr-1')).resolves.toBeNull();
  });

  test('with no custom fallback, a failing call rejects with a 503 ApiError', async () => {
    server = await startServer((req, res) => {
      res.writeHead(500);
      res.end('boom');
    });
    const client = createServiceClient({
      baseURL: `http://127.0.0.1:${server.address().port}`,
      name: 'test',
      timeout: 200,
    });

    await expect(client.get('/thing', 'corr-1')).rejects.toMatchObject({ status: 503 });
    await expect(client.get('/thing', 'corr-1')).rejects.toBeInstanceOf(ApiError);
  });
});
