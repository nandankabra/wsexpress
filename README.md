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
[docs/architecture.md](docs/architecture.md) and [docs/er-diagrams.md](docs/er-diagrams.md) as
Mermaid; editable draw.io versions (use case, ER, and full physical schema diagrams, each with a
PNG export) are in [docs/diagrams/](docs/diagrams/).

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

## Major Feature Enhancements

### 1. Intelligent & Dynamic Delivery Pricing Engine
- **Affordable Benchmark Pricing**: Replaced previous inflated charges (~₹5,000 for 1,000 km) with transparent, realistic logistics pricing. An ordinary 1 kg parcel traveling ~1,000 km (e.g. Delhi to Mumbai road route ~1,438 km) is priced at **~₹340–₹455 INR**.
- **Geodesic Road Distance Service**: Uses Haversine distance calculations enhanced with an empirical **1.25× road circuity factor** and in-memory LRU caching for known coordinates.
- **Volumetric Weight Calculation**: Automatically computes dimensional weight using standard IATA surface formula:
  $$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Width (cm)} \times \text{Height (cm)}}{5000}$$
  The chargeable weight is the greater of actual scale weight and volumetric weight.
- **Itemized Pricing Breakdown**:
  $$\text{Final Price} = \text{Base Fare} + \text{Distance Charge} + \text{Weight Charge} + \text{Express Surcharge} + \text{Fuel Surcharge} + \text{Tax}$$
- **Admin Rate Card Controls & Live Simulator** (`/admin/pricing`): Administrators can review, simulate, and adjust rate card parameters (base fare, distance rate per km, weight rate per kg, express multiplier, safety caps) with instant validation, confirmation dialogs, and revision audit logs.
- **Cryptographic & Authoritative Server Verification**: Client-submitted amounts are never trusted; the backend pricing service calculates authoritative quotes and freezes the pricing version snapshot upon order creation.

### 2. Professional Admin Order Management Dashboard (`/admin/orders`)
- **Executive KPI Cards**: Real-time aggregation of Total Orders, Awaiting Payment, Paid Orders, In-Transit, Delivered, Cancelled, and Total Revenue.
- **Chronological Order Sorting**: Latest orders always display first (`created_at DESC, id DESC`).
- **Server-Side Search, Filter & Pagination**:
  - Search by Order Number, Tracking ID, Customer Name, or Email with debounce.
  - Filter by Order Status (`PENDING`, `CONFIRMED`, `CANCELLED`), Payment Status (`UNPAID`, `PAID`, `FAILED`, `REFUNDED`), Origin/Destination, and Delivery Speed.
  - Sort by Newest, Oldest, Highest Amount, or Lowest Amount.
- **Order Inspection & Dispatch Drawer**: Deep inspection of customer details, parcel dimensions, pricing breakdown, payment transaction receipts, status change history, and carrier assignment actions (`CONFIRM_ORDER`, `ASSIGN_CARRIER`, `CANCEL_ORDER`, `UPDATE_STATUS`).

### 3. Secure Testing-Mode Payment System
- **Strict Testing Mode Operation**: Payment simulation operates strictly with zero real-world financial risk (`testingMode: true`). Rejects real credit card numbers and live credentials.
- **Simulated Payment Instruments**:
  - **Cards**: Test Visa (`4000 0000 0000 0001` - Success), Test Declined (`4000 0000 0000 0002`), Insufficient Funds (`4000 0000 0000 0003`).
  - **UPI**: Test VPA handles (e.g. `customer@okhdfcbank`, `success@upi`).
  - **Net Banking & Wallets**: Direct simulated gateway redirects and callbacks.
- **Concurrency & Idempotency Controls**:
  - Database row locking (`SELECT FOR UPDATE`) prevents concurrent double payments.
  - Request fingerprinting (SHA-256 payload digest + `Idempotency-Key` stored in `payment_idempotency`) ensures safe retries.
  - Decoupled lifecycle: Separate `order_status` (`PENDING`, `CONFIRMED`, `CANCELLED`), `payment_status` (`UNPAID`, `PAID`, `FAILED`, `REFUNDED`), and `shipment_status` (`ORDER_PLACED`, `PICKED_UP`, `IN_TRANSIT`, `DELIVERED`).
  - Transaction ledger (`payments`) and immutable audit trail (`payment_events`).

## Testing

Every service ships Jest + Supertest tests that mock the database/outbound-client layer, so the whole suite runs without any containers:

```bash
npm install
npm test --workspaces --if-present
```

**109 unit tests passing across all 13 workspaces (100% pass rate).**

## Known Limitations

- No live-tested Render deployment (no Render account in this environment) - `render.yaml` and
  the deployment guide are correct per Render's documented Blueprint spec but haven't been
  deployed end-to-end; the frontend's `nginx.conf` needs its `proxy_pass` target updated for
  Render specifically (documented in the deployment guide).
- Coverage thresholds are configured but not enforced as a CI gate; tests cover the golden path,
  RBAC, and validation/error-shape contracts per service rather than exhaustive line coverage.
