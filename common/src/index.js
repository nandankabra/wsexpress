const { ApiError } = require('./errors');
const { correlationId, CORRELATION_HEADER } = require('./correlationId');
const { createLogger, requestLogger } = require('./logger');
const { errorHandler, notFoundHandler } = require('./errorHandler');
const auth = require('./auth');
const { rateLimiter } = require('./rateLimiter');
const { idempotency } = require('./idempotency');
const { validate, ajv } = require('./validate');
const { etag, computeEtag } = require('./etag');
const { encodeCursor, decodeCursor, paginate, paginationLinker } = require('./pagination');
const { contentNegotiation } = require('./contentNegotiation');
const { cacheControl } = require('./cacheControl');
const { createServiceClient } = require('./httpClient');
const { swaggerDocs } = require('./swaggerDocs');
const { createBaseApp } = require('./baseApp');
const { assertProductionConfig } = require('./runtimeConfig');

module.exports = {
  ApiError,
  correlationId,
  CORRELATION_HEADER,
  createLogger,
  requestLogger,
  errorHandler,
  notFoundHandler,
  ...auth,
  rateLimiter,
  idempotency,
  validate,
  ajv,
  etag,
  computeEtag,
  encodeCursor,
  decodeCursor,
  paginate,
  paginationLinker,
  contentNegotiation,
  cacheControl,
  createServiceClient,
  swaggerDocs,
  createBaseApp,
  assertProductionConfig,
};
