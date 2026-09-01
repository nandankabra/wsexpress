const pino = require('pino');
const pinoHttp = require('pino-http');

function createLogger(serviceName) {
  return pino({
    name: serviceName,
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

function requestLogger(logger) {
  return pinoHttp({
    logger,
    genReqId(req, res) {
      return req.correlationId || res.getHeader('X-Correlation-Id');
    },
    customProps(req) {
      return { correlationId: req.correlationId };
    },
    autoLogging: {
      ignore: (req) => req.url === '/health' || req.url === '/healthz',
    },
  });
}

module.exports = { createLogger, requestLogger };
