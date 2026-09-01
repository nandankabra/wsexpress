const { ApiError } = require('./errors');

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * In-memory idempotency store for POST requests carrying an Idempotency-Key header.
 * First request with a given key executes normally and its response is cached;
 * replays with the same key return the cached response instead of re-executing.
 * Swap for a Redis-backed store if a service needs to share state across instances.
 */
function idempotency({ ttlMs = DEFAULT_TTL_MS } = {}) {
  const store = new Map(); // key -> { status, body, expiresAt }

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.expiresAt < now) store.delete(key);
    }
  }, 60_000).unref();

  return (req, res, next) => {
    if (req.method !== 'POST') return next();
    const key = req.headers['idempotency-key'];
    if (!key) return next();

    const cached = store.get(key);
    if (cached) {
      if (JSON.stringify(cached.requestBody) !== JSON.stringify(req.body)) {
        return next(ApiError.conflict('Idempotency-Key already used with a different request body'));
      }
      res.setHeader('Idempotent-Replay', 'true');
      return res.status(cached.status).json(cached.body);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode < 500) {
        store.set(key, {
          status: res.statusCode,
          body,
          requestBody: req.body,
          expiresAt: Date.now() + ttlMs,
        });
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { idempotency };
