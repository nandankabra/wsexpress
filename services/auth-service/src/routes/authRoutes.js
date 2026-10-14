const express = require('express');
const { validate, authenticate, requireRole, idempotency, rateLimiter, etag } = require('@shiptrack/common');
const controller = require('../controllers/authController');
const schemas = require('../middleware/schemas');

const router = express.Router();
const loginLimiter = rateLimiter({ windowMs: 60_000, max: 5000 });

router.post('/register', idempotency(), validate(schemas.registerSchema), controller.register);
router.post('/login', loginLimiter, validate(schemas.loginSchema), controller.login);
router.post('/refresh', validate(schemas.refreshSchema), controller.refresh);
router.post('/logout', validate(schemas.refreshSchema), controller.logout);
router.post('/verify-email', validate(schemas.verifyEmailSchema), controller.verifyEmail);
router.post('/resend-verification', loginLimiter, validate(schemas.forgotPasswordSchema), controller.resendVerification);
router.post('/forgot-password', loginLimiter, validate(schemas.forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', validate(schemas.resetPasswordSchema), controller.resetPassword);
router.get('/me', authenticate, etag(), controller.me);
router.post(
  '/admin/accounts',
  authenticate,
  requireRole('ADMIN'),
  idempotency(),
  validate(schemas.adminCreateAccountSchema),
  controller.adminCreateAccount,
);

module.exports = router;
