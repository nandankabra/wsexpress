const {
  ApiError,
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('@shiptrack/common');
const crypto = require('crypto');
const userModel = require('../models/userModel');
const refreshTokenModel = require('../models/refreshTokenModel');
const verificationTokenModel = require('../models/verificationTokenModel');
const crmClient = require('../clients/crmClient');
const notificationClient = require('../clients/notificationClient');

function refreshExpiryDate() {
  const days = 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  return { otp, hash };
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

async function register({ name, email, password }, correlationId) {
  const existing = await userModel.findByEmail(email);
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }
  const passwordHash = await hashPassword(password);
  // Create user as unverified
  const user = await userModel.create({ name, email, passwordHash, role: 'CUSTOMER', isVerified: false });
  
  // Generate and store verification token
  const { otp, hash } = generateOTP();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await verificationTokenModel.createToken(user.id, hash, 'EMAIL_VERIFICATION', expiresAt);

  // Send email via notification service
  await notificationClient.sendNotification({
    to: email,
    type: 'EMAIL_VERIFICATION',
    data: { name: user.name, otp }
  }, correlationId);

  await crmClient.recordEvent('CUSTOMER_REGISTERED', { entityId: user.id, customerId: user.id }, correlationId);

  // Return user (but no tokens since they can't login yet)
  return { user: toUserResponse(user) };
}

async function verifyEmail(email, otp) {
  const user = await userModel.findByEmail(email);
  if (!user) {
    throw ApiError.unauthorized('Invalid or expired verification code');
  }
  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  const validToken = await verificationTokenModel.findValidToken(user.id, 'EMAIL_VERIFICATION', hash);
  if (!validToken) {
    throw ApiError.unauthorized('Invalid or expired verification code');
  }
  
  await userModel.updateVerification(user.id, true);
  await verificationTokenModel.revokeTokens(user.id, 'EMAIL_VERIFICATION');
}

async function forgotPassword(email) {
  const user = await userModel.findByEmail(email);
  if (!user || !user.is_active) {
    // Return silently to prevent email enumeration
    return;
  }

  await verificationTokenModel.revokeTokens(user.id, 'PASSWORD_RESET');
  const { otp, hash } = generateOTP();
  const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
  await verificationTokenModel.createToken(user.id, hash, 'PASSWORD_RESET', expiresAt);

  await notificationClient.sendNotification({
    to: email,
    type: 'PASSWORD_RESET',
    data: { name: user.name, otp }
  });
}

async function resetPassword(email, otp, newPassword) {
  const user = await userModel.findByEmail(email);
  if (!user) {
    throw ApiError.unauthorized('Invalid or expired reset code');
  }

  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  const validToken = await verificationTokenModel.findValidToken(user.id, 'PASSWORD_RESET', hash);
  if (!validToken) {
    throw ApiError.unauthorized('Invalid or expired reset code');
  }

  const passwordHash = await hashPassword(newPassword);
  await userModel.updatePassword(user.id, passwordHash);
  await verificationTokenModel.revokeTokens(user.id, 'PASSWORD_RESET');
  // Revoke all existing sessions
  await refreshTokenModel.revokeAllForUser(user.id);
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
  const user = await userModel.create({ name, email, passwordHash, role, isVerified: true });
  return toUserResponse(user);
}

async function login({ email, password }) {
  const user = await userModel.findByEmail(email);
  if (!user || !user.is_active) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.is_verified) {
    throw ApiError.forbidden('Please verify your email address before logging in');
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
  if (!user.is_verified) {
    throw ApiError.forbidden('Please verify your email address');
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

async function resendVerification(email) {
  const user = await userModel.findByEmail(email);
  if (!user || !user.is_active || user.is_verified) {
    return; // Silent return
  }

  await verificationTokenModel.revokeTokens(user.id, 'EMAIL_VERIFICATION');
  const { otp, hash } = generateOTP();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await verificationTokenModel.createToken(user.id, hash, 'EMAIL_VERIFICATION', expiresAt);

  await notificationClient.sendNotification({
    to: email,
    type: 'EMAIL_VERIFICATION',
    data: { name: user.name, otp }
  });
}

module.exports = { register, verifyEmail, resendVerification, forgotPassword, resetPassword, adminCreateAccount, login, refresh, logout, getProfile, toUserResponse };
