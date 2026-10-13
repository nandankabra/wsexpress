const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { correlationId } = require('./correlationId');
const { createLogger, requestLogger } = require('./logger');
const { paginationLinker } = require('./pagination');
const { assertProductionConfig } = require('./runtimeConfig');

/**
 * Wires the cross-cutting middleware every ShipTrack service needs, in the order that
 * makes them compose correctly (correlation id before logging, logging before routes).
 * Route-specific concerns (auth, validation, idempotency, etag, rate limits) are applied
 * per-router by each service since they don't apply uniformly to every endpoint.
 */
function createBaseApp(serviceName) {
  assertProductionConfig({ requireCors: serviceName === 'api-gateway' });
  const app = express();
  const logger = createLogger(serviceName);
  const allowedOrigins = (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.set('trust proxy', true);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin: allowedOrigins.includes('*')
      ? true
      : (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
  }));
  app.use(correlationId);
  app.use(requestLogger(logger));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(paginationLinker);

  app.get(['/health', '/healthz'], (req, res) => {
    res.json({ status: 'UP', service: serviceName, timestamp: new Date().toISOString() });
  });

  app.locals.logger = logger;
  return { app, logger };
}

module.exports = { createBaseApp };
