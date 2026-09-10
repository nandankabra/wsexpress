const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const {
  correlationId,
  createLogger,
  requestLogger,
  errorHandler,
  notFoundHandler,
  rateLimiter,
  swaggerDocs,
  assertProductionConfig,
} = require('@shiptrack/common');
const { gatewayAuth } = require('./middleware/gatewayAuth');
const { createServiceProxy } = require('./proxy/createServiceProxy');
const { buildRouteTable } = require('./proxy/routes');

const SERVICE_NAME = 'api-gateway';

function buildApp() {
  assertProductionConfig({ requireCors: true });
  const app = express();
  const logger = createLogger(SERVICE_NAME);
  const allowedOrigins = (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin: allowedOrigins.includes('*')
      ? true
      : (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
  }));
  app.use(correlationId);
  app.use(requestLogger(logger));
  // Deliberately no express.json() here: this is a pure reverse proxy, so request bodies
  // must be streamed through to the upstream service untouched rather than parsed and
  // re-serialized (parsing here would consume the stream before the proxy can forward it).
  app.use(rateLimiter({ windowMs: 60_000, max: 600 }));

  app.get(['/health', '/healthz'], (req, res) => {
    res.json({ status: 'UP', service: SERVICE_NAME, timestamp: new Date().toISOString() });
  });

  swaggerDocs(app, path.join(__dirname, '..', 'openapi.yaml'));

  app.use(gatewayAuth);

  for (const { path: mountPath, target } of buildRouteTable()) {
    if (!target) continue;
    const serviceName = mountPath.replace('/api/v1/', '').replace('/', '');
    app.use(mountPath, createServiceProxy(target, serviceName, mountPath));
  }

  app.use(notFoundHandler);
  app.use(errorHandler(SERVICE_NAME));
  return app;
}

module.exports = { buildApp, SERVICE_NAME };
