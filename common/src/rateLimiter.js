const rateLimit = require('express-rate-limit');
const { ApiError } = require('./errors');

function rateLimiter({ windowMs = 60_000, max = 100 } = {}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler(req, res, next) {
      next(ApiError.tooManyRequests('Too many requests, please try again later'));
    },
  });
}

module.exports = { rateLimiter };
