# ShipTrack – Logistics & Shipment Tracking Platform

A production-grade logistics platform built as 12 independent Node.js/Express microservices
behind an API Gateway, with a React (Vite + Tailwind) frontend serving three portals -
Customer, Carrier, and Admin/CRM. Built for a Web Services & Microservices assignment; covers
REST, GraphQL, SOAP, JWT/RBAC, resilience patterns, and polyglot persistence
(PostgreSQL + MySQL + MongoDB) end to end.

> **Previous implementation**: an earlier Spring Boot/Java version of this platform lives in
> [`legacy-java-backup/`](legacy-java-backup/) (and in full in git history) - it was fully
> working but superseded by this Node.js/React rewrite per the current project spec, which
> mandates the JS stack.

## Quick Start

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps            # wait for everything to report "healthy"
```

- Frontend: http://localhost:3001
- API Gateway (Swagger): http://localhost:18000/api-docs
- GraphQL (Apollo Sandbox): http://localhost:8011/graphql
- Default admin login: `admin@shiptrack.local` / `Admin@12345` (seeded on first boot)

See [docs/deployment-guide.md](docs/deployment-guide.md) for the full walkthrough, port
overrides, and the Render deployment path.

## Tech Stack

React 18 + Vite + Tailwind CSS + Axios + React Router DOM · Node.js + Express.js ·
PostgreSQL + MySQL + MongoDB · JWT + bcrypt · GraphQL (Apollo Server) · SOAP (`node-soap`,
WSDL-first) · Swagger UI / hand-written OpenAPI 3.1 · Docker + Docker Compose · Jest + Supertest.

## Architecture

12 independent services, each with its own database and its own `openapi.yaml`:

| Service | Port | Database | Responsibilities |
|---|---|---|---|
| api-gateway | 8000 | - | Routing, JWT validation, rate limiting, correlation IDs, logging |
| auth-service | 8001 | PostgreSQL | Register, login, refresh/logout, RBAC identity store |
| user-service | 8002 | PostgreSQL | Customer profiles |
| carrier-service | 8003 | PostgreSQL | Carrier profiles, admin verification |
| shipment-service | 8004 | PostgreSQL | Shipments, quotes, delivery info, public tracking lookup |
| tracking-service | 8005 | MongoDB | Tracking events, status history |
| pricing-service | 8006 | MySQL | Shipping cost calculation, SOAP currency conversion |
| location-service | 8007 | MySQL | Countries/cities/warehouses/routes, SOAP country info |
| crm-service | 8008 | MongoDB | Customer/shipment/carrier analytics |
| audit-service | 8009 | MongoDB | Audit logs, security events, API request logs |
| notification-service | 8010 | - | Email notifications |
| graphql-service | 8011 | - | Aggregated shipment/tracking/customer-dashboard queries |

Full diagrams (service topology, request lifecycle, ER diagrams for all three databases) are in
[docs/architecture.md](docs/architecture.md) and [docs/er-diagrams.md](docs/er-diagrams.md).

## Roles

- **Guest** (no login): view services, search public tracking IDs, view shipment status.
- **Customer**: register, login, create shipments, get quotes, track shipments, view history,
  manage profile.
- **Carrier**: login (admin-provisioned account), claim unassigned shipments, update shipment
  status, add tracking events, update delivery details.
- **Admin**: manage customers/carriers/shipments, view CRM analytics, view audit logs.

## Repository Layout

```
common/                @shiptrack/common - shared Express middleware (auth, validation,
                        rate limiting, idempotency, ETag, pagination, resilient httpClient, ...)
services/<name>/        each: src/{controllers,routes,services,models,middleware},
                        openapi.yaml, Dockerfile, .env.example, tests/
frontend/               React app - Customer/Carrier/Admin portals
infra/                  Postgres/MySQL multi-database init scripts
docs/                   architecture, ER diagrams, deployment guide
postman/                Postman collection covering every endpoint
.github/workflows/      CI (tests + Docker image builds)
docker-compose.yml       single-command local deployment
render.yaml              Render Blueprint for cloud deployment
legacy-java-backup/      the original Spring Boot implementation
```

## The 28 Web Services Requirements

Implemented via `@shiptrack/common` (shared once, used by every service) unless noted:

**REST** - correct HTTP methods; `Idempotency-Key` on POST; AJV JSON Schema validation;
`/api/v1` versioning; 8+ distinct status codes (200/201/204/304/400/401/403/404/409/412/422/429/503);
ETag + `If-None-Match` → 304; content negotiation (JSON default, `Accept: application/xml`);
cursor-based pagination; consistent `{ error: { code, message, ... } }` shape; `Cache-Control`
headers; resource-based URLs; rate limiting → 429.
**Documentation** - hand-written `openapi.yaml` per service; Swagger UI at `/api-docs`.
**Integration** - GraphQL endpoint (graphql-service); SOAP WSDL reading + SOAP request execution
(pricing-service reads location-service's WSDL and calls it; both also serve their own WSDLs).
**Resilience** - timeout + exponential-backoff retry + circuit breaker (Opossum) on every
outbound inter-service call, each with a sensible fallback.
**Middleware** - Express middleware throughout; central error handler; structured logging
(Pino) with correlation IDs propagated end to end.
**Databases** - PostgreSQL + MySQL (SQL) and MongoDB (NoSQL).
**Security** - JWT authentication; role-based authorization (gateway-level + per-service).

## Testing

Every service ships Jest + Supertest tests that mock the database/outbound-client layer, so the
whole suite runs without any containers:

```bash
npm install
npm test --workspaces --if-present
```

## Known Limitations

- No live-tested Render deployment (no Render account in this environment) - `render.yaml` and
  the deployment guide are correct per Render's documented Blueprint spec but haven't been
  deployed end-to-end; the frontend's `nginx.conf` needs its `proxy_pass` target updated for
  Render specifically (documented in the deployment guide).
- Coverage thresholds are configured but not enforced as a CI gate; tests cover the golden path,
  RBAC, and validation/error-shape contracts per service rather than exhaustive line coverage.
