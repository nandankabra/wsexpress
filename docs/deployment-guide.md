# ShipTrack Deployment Guide

## 1. Local Deployment (Docker Compose)

This is the primary, fully-tested deployment path.

### Prerequisites
- Docker + Docker Compose v2
- Ports available on the host: `15432` (Postgres), `13306` (MySQL), `27019` (Mongo), `8001-8011`
  (individual services), `18000` (API Gateway), `3001` (frontend). Override any of these in
  `.env` if they're already taken on your machine - the defaults deliberately avoid the common
  `8000`/`3000`/`27018` in case something else on the host is already using them.

### Steps

```bash
cp .env.example .env       # adjust JWT secrets / credentials if you like
docker compose up -d --build
docker compose ps          # wait until everything shows "healthy"
```

Once healthy:
- Frontend: http://localhost:3001
- API Gateway: http://localhost:18000 (Swagger at http://localhost:18000/api-docs)
- Every service's own Swagger UI: `http://localhost:<port>/api-docs` (e.g. auth-service at
  http://localhost:8001/api-docs)
- GraphQL: http://localhost:8011/graphql (Apollo Sandbox in a browser) or via the gateway at
  http://localhost:18000/graphql
- location-service SOAP WSDL: http://localhost:8007/wsdl/country?wsdl
- pricing-service SOAP WSDL: http://localhost:8006/wsdl/currency?wsdl

A default admin account is seeded on first boot from `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env`
(defaults: `admin@shiptrack.local` / `Admin@12345`) - use it to log into the CRM admin portal
and provision carrier accounts (`POST /api/v1/auth/admin/accounts`).

### Tear down

```bash
docker compose down          # stop and remove containers, keep data volumes
docker compose down -v       # also wipe the databases
```

### Running tests without Docker

Every service's Jest/Supertest suite mocks its database layer, so tests run without any
containers:

```bash
npm install
npm test --workspaces --if-present
```

## 2. Render Deployment

`render.yaml` at the repo root is a Render Blueprint covering all 12 backend services + the
frontend as Docker web services, plus a managed PostgreSQL database.

**Render has no managed MySQL or MongoDB.** Before or after deploying the blueprint, provision:
- A MySQL instance (e.g. PlanetScale, Aiven, or any reachable MySQL 8+ server) for
  `location-service` and `pricing-service` - two logical databases, `location_db` and
  `pricing_db`, either as separate databases on one instance or two instances.
- A MongoDB instance (e.g. MongoDB Atlas free tier) for `tracking-service`, `crm-service`, and
  `audit-service` - three logical databases (`tracking_db`, `crm_db`, `audit_db`), typically on
  one cluster.

### Steps

1. Push this repository to GitHub.
2. In the Render dashboard: **New → Blueprint**, select the repo. Render reads `render.yaml`
   and provisions the Postgres database plus every service.
3. Fill in the env vars marked `sync: false` in the Render dashboard for each service:
   `MYSQL_HOST` / `MYSQL_USER` / `MYSQL_PASSWORD` (location-service, pricing-service),
   `MONGO_URL` (tracking/crm/audit-service), `ADMIN_PASSWORD` (auth-service), and SMTP
   credentials (notification-service, optional - it falls back to a JSON/log transport).
4. `JWT_SECRET` / `JWT_REFRESH_SECRET` are auto-generated only on `auth-service`; copy those
   two generated values into every other service's env vars (Render's blueprint spec doesn't
   support sharing one generated value across services) - **they must be identical everywhere**,
   since auth-service signs tokens that every other service verifies.
5. **Frontend note**: `frontend/nginx.conf` proxies `/api/v1` and `/graphql` to
   `http://api-gateway:8000`, which only resolves inside the Docker Compose network. On Render,
   update `nginx.conf`'s `proxy_pass` targets to the deployed API Gateway's public
   `https://shiptrack-api-gateway.onrender.com` URL before building the frontend service (or
   template it at container start via `envsubst`).
6. Redeploy the frontend after step 5, then visit its Render URL.

## 3. Configuration Reference

See each service's `.env.example` for its full list of environment variables. The variables
that matter most across the whole platform:

| Variable | Purpose |
|---|---|
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Must be identical across every service |
| `DATABASE_URL` | Postgres connection string (auth/user/carrier/shipment-service) |
| `MYSQL_HOST`/`MYSQL_PORT`/`MYSQL_USER`/`MYSQL_PASSWORD`/`MYSQL_DATABASE` | MySQL (location/pricing-service) |
| `MONGO_URL` | MongoDB connection string incl. database name (tracking/crm/audit-service) |
| `<SERVICE>_SERVICE_URL` | Base URL another service uses to reach it (api-gateway, shipment-service, pricing-service, graphql-service) |
