const { verifyAccessToken, ApiError } = require('@shiptrack/common');

/**
 * Gateway-level JWT validation: if an Authorization bearer token is present, it must be
 * valid (rejects tampered/expired tokens with 401 before they reach any downstream
 * service). No token at all is allowed through as a guest - each downstream service still
 * enforces its own required-auth/RBAC per route, so this is defense in depth, not the only
 * check. Decoded identity is forwarded as X-User-* headers for downstream convenience.
 */
function gatewayAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    req.headers['x-user-id'] = payload.sub;
    req.headers['x-user-role'] = payload.role;
    next();
  } catch (err) {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

module.exports = { gatewayAuth };
