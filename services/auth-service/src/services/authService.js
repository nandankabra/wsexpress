const {
  ApiError,
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('@shiptrack/common');
const userModel = require('../models/userModel');
const refreshTokenModel = require('../models/refreshTokenModel');

function refreshExpiryDate() {
  const days = 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function toUserResponse(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.is_active,
    createdAt: user.created_at,
  };
}

async function issueTokens(user) {
  const claims = { sub: user.id, email: user.email, role: user.role, name: user.name };
  const accessToken = signAccessToken(claims);
  const refreshToken = signRefreshToken({ sub: user.id });
  await refreshTokenModel.store({ userId: user.id, token: refreshToken, expiresAt: refreshExpiryDate() });
  return { accessToken, refreshToken };
}

async function register({ name, email, password }) {
  const existing = await userModel.findByEmail(email);
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }
  const passwordHash = await hashPassword(password);
  const user = await userModel.create({ name, email, passwordHash, role: 'CUSTOMER' });
  const tokens = await issueTokens(user);
  return { user: toUserResponse(user), ...tokens };
}

async function adminCreateAccount({ name, email, password, role }) {
  if (!['CARRIER', 'ADMIN'].includes(role)) {
    throw ApiError.badRequest('role must be CARRIER or ADMIN');
  }
  const existing = await userModel.findByEmail(email);
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }
  const passwordHash = await hashPassword(password);
  const user = await userModel.create({ name, email, passwordHash, role });
  return toUserResponse(user);
}

async function login({ email, password }) {
  const user = await userModel.findByEmail(email);
  if (!user || !user.is_active) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  const tokens = await issueTokens(user);
  return { user: toUserResponse(user), ...tokens };
}

async function refresh(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
  const stored = await refreshTokenModel.findActive(refreshToken);
  if (!stored) {
    throw ApiError.unauthorized('Refresh token has been revoked or is unknown');
  }
  const user = await userModel.findById(payload.sub);
  if (!user || !user.is_active) {
    throw ApiError.unauthorized('Account is no longer active');
  }
  await refreshTokenModel.revoke(refreshToken);
  const tokens = await issueTokens(user);
  return { user: toUserResponse(user), ...tokens };
}

async function logout(refreshToken) {
  if (refreshToken) {
    await refreshTokenModel.revoke(refreshToken);
  }
}

async function getProfile(userId) {
  const user = await userModel.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return toUserResponse(user);
}

module.exports = { register, adminCreateAccount, login, refresh, logout, getProfile, toUserResponse };
