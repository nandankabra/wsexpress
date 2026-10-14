const rateLimit = require('express-rate-limit');
const { ApiError } = require('./errors');

function rateLimiter({ windowMs = 60_000, max = 5000, keyGenerator } = {}) {
  // If rate limiting is disabled via env var, return a pass-through middleware
  if (process.env.RATE_LIMIT_DISABLED === 'true' || process.env.DISABLE_RATE_LIMIT === 'true') {
    return (req, res, next) => next();
  }

  // Ensure minimum threshold of 2,000 requests per minute to prevent 429 during active usage/testing
  const effectiveMax = Math.max(Number(max) || 5000, 2000);

  return rateLimit({
    windowMs,
    max: effectiveMax,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
    keyGenerator:
      keyGenerator ||
      ((req) => {
        // Prioritize actual client IP from X-Forwarded-For if available behind proxies (Render, Cloudflare, etc.)
        const forwarded = req.headers['x-forwarded-for'];
        const clientIp = forwarded ? forwarded.split(',')[0].trim() : req.ip;

        // If an email is provided in the body (e.g. login/register), bucket per email + IP
        // so multiple accounts do not share the exact same quota
        if (req.body && typeof req.body.email === 'string') {
          return `${clientIp}_${req.body.email.toLowerCase().trim()}`;
        }
        return clientIp || 'global_client';
      }),
    handler(req, res, next) {
      next(ApiError.tooManyRequests('Too many requests, please try again later'));
    },
  });
}

module.exports = { rateLimiter };
