const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ApiError } = require('./errors');

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || '7d';

function getSecret(name) {
  const secret = process.env[name];
  if (!secret) {
    throw new Error(`Missing required env var ${name}`);
  }
  return secret;
}

function signAccessToken(payload) {
  return jwt.sign(payload, getSecret('JWT_SECRET'), { expiresIn: ACCESS_TOKEN_TTL });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, getSecret('JWT_REFRESH_SECRET'), { expiresIn: REFRESH_TOKEN_TTL });
}

function verifyAccessToken(token) {
  return jwt.verify(token, getSecret('JWT_SECRET'));
}

function verifyRefreshToken(token) {
  return jwt.verify(token, getSecret('JWT_REFRESH_SECRET'));
}

function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing bearer token'));
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

function optionalAuthenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }
  const token = header.slice('Bearer '.length);
  try {
    req.user = verifyAccessToken(token);
  } catch (err) {
    // guest fallthrough
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Requires role: ${roles.join(' or ')}`));
    }
    next();
  };
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
  authenticate,
  optionalAuthenticate,
  requireRole,
};
