# ShipTrack Auth Service — Technical Analysis Report

**Prepared by:** Neeraj Sharma  
**Service:** Auth Service  
**Service directory:** `services/auth-service/`  
**Default local port:** `8001`  
**API specification:** `services/auth-service/openapi.yaml`

> **Report scope:** This document analyzes the existing implementation. It does not claim that the author originally implemented the service. No application source code is changed by adding this report. Runtime test results must be recorded only after the tests have actually been run.

## 1. Purpose

The Auth Service manages ShipTrack user identities and authentication. It provides account registration, login, access-token and refresh-token handling, email verification, password recovery, current-user information, and restricted account creation for administrators.

The service is implemented with Node.js and Express. It uses shared utilities from `@shiptrack/common`, PostgreSQL models, and supporting clients for email notifications and CRM events.

## 2. Main Components and Responsibilities

| Component | Responsibility |
|---|---|
| `src/server.js` | Starts the service. |
| `src/app.js` | Builds the Express application and mounts middleware/routes. |
| `src/routes/authRoutes.js` | Declares authentication endpoints and attaches validation, authentication, role, idempotency, rate-limit, and ETag middleware. |
| `src/controllers/authController.js` | Handles HTTP requests, invokes service methods, and formats HTTP responses. |
| `src/services/authService.js` | Contains the main registration, login, token, verification, and password-recovery logic. |
| `src/models/userModel.js` | Reads and writes user identity records. |
| `src/models/refreshTokenModel.js` | Persists and revokes refresh-token records. |
| `src/models/verificationTokenModel.js` | Stores and revokes verification/password-reset token records. |
| `src/middleware/schemas.js` | Defines request validation schemas. |
| `src/services/mailer.js` | Sends verification and password-reset emails. |
| `src/clients/crmClient.js` | Sends customer-registration events to the CRM integration. |
| `src/clients/notificationClient.js` | Provides the notification integration used by the service. |
| `tests/auth.routes.test.js` | Contains automated route-level tests using Jest and Supertest. |
| `openapi.yaml` | Describes the public HTTP API contract. |

## 3. API Endpoint Summary

The OpenAPI file lists the direct service URL as `http://localhost:8001` and a gateway URL under `/api/v1/auth`. The route definitions use the following API paths.

| Method and endpoint | Purpose | Important behavior documented/implemented |
|---|---|---|
| `POST /api/v1/auth/register` | Register a customer | Validates the request, uses idempotency middleware, creates an unverified customer account, and initiates email verification. Returns `201` on success. |
| `POST /api/v1/auth/login` | Authenticate with email and password | Uses request validation and a rate limiter. Successful login returns user data and tokens. |
| `POST /api/v1/auth/refresh` | Obtain a new token pair | Accepts a refresh token and asks the service to refresh it. |
| `POST /api/v1/auth/logout` | Log out | Accepts a refresh token and revokes it; the controller returns `204` on success. |
| `POST /api/v1/auth/verify-email` | Verify an email address | Accepts email and OTP fields and verifies the account. |
| `POST /api/v1/auth/resend-verification` | Resend verification | Applies rate limiting and asks the service to resend verification instructions. |
| `POST /api/v1/auth/forgot-password` | Start password recovery | Applies rate limiting and responds with a generic message to reduce account enumeration. |
| `POST /api/v1/auth/reset-password` | Reset a password | Accepts email, OTP, and new password. |
| `GET /api/v1/auth/me` | Get the authenticated identity | Requires a valid access token and supports ETag middleware. |
| `POST /api/v1/auth/admin/accounts` | Create a restricted account as an administrator | Requires authentication and the `ADMIN` role in the route middleware; uses validation and idempotency middleware. |

Common response categories include `201` for creation, `200` for successful operations, `204` for logout, `400` for invalid requests, `401` for invalid credentials/tokens, `403` for insufficient permissions, `409` for a duplicate account, and `429` for rate limiting where applicable. Exact endpoint responses should be checked against `openapi.yaml` and the current route/controller code.

## 4. Main Authentication Flows

### 4.1 Registration and email verification

1. The client sends a name, email, and password to the registration endpoint.
2. Request validation checks the submitted data.
3. The service checks whether the email already exists.
4. For a new account, the password is hashed before it is stored. The account is created with the `CUSTOMER` role and is initially unverified.
5. The service generates a verification code, stores a hash of the code with an expiry, and sends the code through the mailer.
6. A CRM event is recorded for a newly created customer.
7. The client submits the email and code to the verification endpoint. On successful verification, the account's verified state is updated and the verification tokens are revoked.

The registration test checks invalid request handling, account creation, verification-email initiation, CRM event recording, and duplicate-email rejection.

### 4.2 Login and token lifecycle

1. The client submits an email and password.
2. The service finds the account and compares the submitted password with the stored password hash.
3. The service rejects invalid credentials and prevents login when the email is not verified.
4. On successful login, it issues an access token and refresh token. The refresh token is stored with an expiry.
5. The client can use the access token on protected endpoints and submit the refresh token to obtain a new token pair.
6. Logout revokes the submitted refresh token.

### 4.3 Password recovery

The forgot-password endpoint uses a generic response so callers are not directly told whether an email address has an account. For an eligible active account, the service creates a password-reset code with a one-hour expiry and sends it by email. The reset endpoint validates the code, hashes the new password, updates the stored password, and revokes applicable reset and refresh tokens.

## 5. Security and Reliability Controls Present in the Code

- Passwords are hashed and compared using shared password utilities.
- Access tokens and refresh tokens are signed using separate shared utilities/secrets.
- Refresh-token records are stored and can be revoked.
- Request schemas validate important input fields.
- Login and selected recovery endpoints use rate limiting.
- Authentication middleware protects identity-specific endpoints.
- Role middleware restricts administrator account creation.
- Registration uses idempotency middleware to help safely handle retries.
- Shared error-handling utilities provide a consistent error-response structure.

These are observations of the code structure, not a guarantee that every production configuration is secure. Deployment environment variables and live configuration must also be reviewed.

## 6. Review Findings and Items Requiring Attention

The current service code contains development/demo behavior that should be verified against the deployed environment before it is described as production-safe:

1. **Fixed OTP bypass:** `authService.js` accepts `000000` as a special code for both email verification and password reset. This is a critical authentication weakness if reachable in a real deployment. Confirm whether it is intended only for a controlled demo; it should not be enabled in production.
2. **OTP logging:** The service logs verification and password-reset OTP values with a developer-mode label. If production logs can contain these values, anyone with log access may be able to use them. Confirm the runtime configuration and remove or disable sensitive-code logging in production through an approved code change.
3. **OTP generation:** The current `generateOTP()` implementation uses `Math.random()` to generate the six-digit OTP. Security-sensitive one-time codes should be generated with a cryptographically secure random source.
4. **Operational configuration:** Verify that token secrets are strong, unique, supplied through protected environment configuration, and not committed to source control.
5. **Email/CRM dependency failures:** Confirm the intended behavior when email delivery or CRM event recording fails, and whether retries or operational alerts are configured.

This report documents findings only; no application code has been modified as part of this report.

## 7. Existing Automated Tests

The repository contains `services/auth-service/tests/auth.routes.test.js`. The visible test cases cover invalid registration data, successful registration and side effects, duplicate email, unknown email login, wrong password, unverified email, successful login, authentication required for `/me`, and rejection of customer access to the admin account-creation route.

**Execution status:** Not run while preparing this report. Do not interpret the listed test cases as a passing test run. To verify them locally, install dependencies using the repository's documented workflow and run the Auth Service test script from its directory:

```bash
cd services/auth-service
npm test
```

Record the date, command, environment, and actual pass/fail output after running it. Use test secrets and a non-production environment.

## 8. Suggested Verification Checklist

- [ ] Confirm registration rejects malformed input and duplicate verified email addresses.
- [ ] Confirm unverified accounts cannot log in.
- [ ] Confirm successful login returns the expected token fields.
- [ ] Confirm missing/invalid access tokens are rejected by protected routes.
- [ ] Confirm non-admin users cannot create restricted accounts.
- [ ] Confirm refresh-token expiry and revocation behavior.
- [ ] Confirm expired/invalid OTPs are rejected and fixed demo OTP behavior is not enabled in production.
- [ ] Confirm production logs never expose passwords, OTPs, or tokens.
- [ ] Run the automated test suite and attach actual output.


