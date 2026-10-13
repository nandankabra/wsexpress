# ShipTrack User Service — Technical Analysis Report

**Prepared by:** Neeraj Sharma  
**Service:** User Service  
**Service directory:** `services/user-service/`  
**Default local port:** `8002`  
**API specification:** `services/user-service/openapi.yaml`

> **Report scope:** This document analyzes the existing implementation. It does not claim that the author originally implemented the service. No application source code is changed by adding this report. Runtime test results must be recorded only after the tests have actually been run.

## 1. Purpose

The User Service manages customer profile information for ShipTrack. It stores profile details separately from the authentication identity record and provides endpoints for a customer to view or update their own profile. It also provides administrator-only endpoints for viewing individual customer profiles and listing profiles in pages.

The service is implemented with Node.js and Express, uses PostgreSQL for persistence, and imports shared authentication, validation, caching, ETag, pagination, and error-handling utilities from `@shiptrack/common`.

## 2. Main Components and Responsibilities

| Component | Responsibility |
|---|---|
| `src/server.js` | Starts the service. |
| `src/app.js` | Builds the Express application and mounts middleware/routes. |
| `src/routes/profileRoutes.js` | Defines profile routes and attaches authentication, role, validation, ETag, and cache-control middleware. |
| `src/controllers/profileController.js` | Maps HTTP requests to service operations and returns HTTP responses. |
| `src/services/profileService.js` | Handles profile retrieval, create/update operations, response mapping, and paginated listing. |
| `src/models/profileModel.js` | Runs PostgreSQL queries for profile upsert, lookup, and paginated listing. |
| `src/middleware/schemas.js` | Defines the profile request validation schema. |
| `src/db/pool.js` | Provides the PostgreSQL connection pool. |
| `src/db/migrate.js` | Contains database migration/setup logic. |
| `tests/profile.routes.test.js` | Contains route-level tests using Jest and Supertest. |
| `openapi.yaml` | Describes the profile API contract and response schemas. |

## 3. Data Model

The persistence layer operates on the `customer_profiles` table. The model references these profile fields:

- `user_id` — identity key for the associated user.
- `full_name` and `email` — core contact/profile fields.
- `phone` — optional phone number.
- `address_line1`, `address_line2`, `city`, `state`, `postal_code`, and `country` — optional address details.
- `created_at` and `updated_at` — timestamps exposed by the service response.

The model uses `user_id` as the conflict key for an upsert. This means a profile can be inserted for a user or updated if a row for that user already exists. The API response mapper converts database-style column names into camelCase JSON properties.

## 4. API Endpoint Summary

The OpenAPI file lists the direct service URL as `http://localhost:8002` and a gateway URL under `/api/v1/customers`.

| Method and endpoint | Access control | Purpose |
|---|---|---|
| `GET /api/v1/customers/me` | Authenticated `CUSTOMER` | Returns the current customer's profile. Uses ETag and short cache-control middleware. Returns `404` if no profile exists. |
| `PUT /api/v1/customers/me` | Authenticated `CUSTOMER` | Creates or updates the current customer's profile after request validation. Returns the saved profile. |
| `GET /api/v1/customers` | Authenticated `ADMIN` | Returns a cursor-paginated list of customer profiles. The requested page size defaults to 20 and is capped at 100 in the controller. |
| `GET /api/v1/customers/:userId` | Authenticated `ADMIN` | Returns a profile for the supplied user ID and uses ETag middleware. |

The profile upsert request requires `fullName` and `email`. Optional fields include `phone`, `addressLine1`, `addressLine2`, `city`, `state`, `postalCode`, and `country`. The OpenAPI contract describes a bearer JWT security scheme.

## 5. Request Processing and Data Flow

### 5.1 Customer reads their profile

1. The client sends a GET request to `/api/v1/customers/me` with a bearer access token.
2. Authentication middleware validates the token and makes the authenticated identity available as `req.user`.
3. Role middleware ensures the caller has the `CUSTOMER` role.
4. The controller passes the authenticated subject (`req.user.sub`) to the profile service.
5. The service asks the model to find the profile by `user_id`.
6. If a row exists, the service maps it into the API response. If no row exists, it raises a not-found error.

Using the subject from the validated token rather than accepting a user ID from the customer request helps prevent a customer from choosing another user's ID for this endpoint.

### 5.2 Customer creates or updates their profile

1. The client sends a PUT request to `/api/v1/customers/me` with a bearer token and JSON profile fields.
2. Authentication and customer-role middleware run before the controller.
3. The request body is checked against the upsert schema.
4. The service calls the model's upsert method with the authenticated user's ID and validated data.
5. PostgreSQL inserts the profile or updates the existing row for that user.
6. The service maps the returned database row into the response and the controller returns `200`.

### 5.3 Administrator lists profiles

1. The administrator sends a GET request to `/api/v1/customers` with a bearer token.
2. Authentication middleware validates the token and role middleware requires `ADMIN`.
3. The controller reads the `cursor` and `limit` query parameters and caps the limit at 100.
4. The service decodes the cursor, fetches a page from the model, and constructs pagination metadata.
5. The response contains a `data` array and `pagination` information.

## 6. Security, Performance, and Reliability Controls Present in the Code

- Bearer-token authentication is applied to all profile routes.
- Customers can access only their own `/me` profile endpoints through the route design.
- Administrator-only routes use role-based access control.
- The profile update endpoint validates its request body.
- SQL queries use parameterized values rather than concatenating user-supplied values into SQL statements.
- Listing uses cursor-based pagination and limits page size.
- The current-profile read route uses ETag and cache-control middleware; the admin detail route uses ETag middleware.
- Missing profiles produce a not-found error rather than an empty success response.
- Shared error handling is used by the service application.

These are code-level observations. They do not replace production configuration review, database access controls, or end-to-end security testing.

## 7. Review Findings and Items Requiring Attention

1. **Profile email consistency:** The profile model stores an email field separately from the identity data managed by Auth Service. Review how the application keeps these two values consistent when an account email changes. This report does not establish that synchronization currently exists.
2. **Profile ownership and role tests:** Existing tests cover customer/admin access behavior, but additional negative tests could verify that one customer cannot retrieve or overwrite another customer's profile and that every administrator-only endpoint consistently rejects non-admin roles.
3. **Cursor validation:** The service decodes a supplied cursor. Test malformed, tampered, and stale cursor values to ensure errors are returned consistently and do not expose internal details.
4. **Cache behavior:** Because the current-profile route has cache-control and ETag middleware, verify that authenticated profile responses cannot be reused across different users by shared caches and that updates lead to appropriate cache revalidation.
5. **Data validation:** Verify field lengths, optional-field handling, email normalization, and any required business rules against the request schema and database constraints.

This report records review items only; no application code has been modified as part of this report.

## 8. Existing Automated Tests

The repository contains `services/user-service/tests/profile.routes.test.js`. The visible test cases cover unauthenticated access to the current profile, rejection of an admin token on the customer endpoint, a missing profile, successful profile retrieval, invalid update bodies, successful profile upsert, rejection of customer access to the admin list endpoint, and successful paginated listing for an admin.

**Execution status:** Not run while preparing this report. The presence of test cases does not mean they have passed. To verify them locally, install dependencies using the repository's documented workflow and run the User Service test script from its directory:

```bash
cd services/user-service
npm test
```

Record the date, command, environment, and actual pass/fail output after running it. Use a test environment rather than production data.

## 9. Suggested Verification Checklist

- [ ] Confirm unauthenticated callers receive `401` for protected endpoints.
- [ ] Confirm a customer can read only their own profile through `/me`.
- [ ] Confirm a customer can create/update their own profile with valid input.
- [ ] Confirm invalid or missing required profile fields are rejected.
- [ ] Confirm non-admin callers cannot list profiles or request another user's profile.
- [ ] Confirm an admin can list profiles and that pagination metadata is correct.
- [ ] Test missing profiles and malformed cursor values.
- [ ] Verify ETag/cache behavior does not expose one user's profile to another user.
- [ ] Review consistency between Auth Service identity email and profile email.
- [ ] Run the automated test suite and attach actual output.



.
