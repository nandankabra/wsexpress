const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body, req.correlationId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function adminCreateAccount(req, res, next) {
  try {
    const result = await authService.adminCreateAccount(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.body.refreshToken);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.sub);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    await authService.verifyEmail(req.body.email, req.body.otp);
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    await authService.forgotPassword(req.body.email);
    res.status(200).json({ message: 'If an account exists, a reset code has been sent' });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    await authService.resetPassword(req.body.email, req.body.otp, req.body.newPassword);
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
}

async function resendVerification(req, res, next) {
  try {
    await authService.resendVerification(req.body.email);
    res.status(200).json({ message: 'If the account exists and is unverified, a new link has been sent' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, adminCreateAccount, login, refresh, logout, me, verifyEmail, resendVerification, forgotPassword, resetPassword };
