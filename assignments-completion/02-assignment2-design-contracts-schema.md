# Assignment 2 — Services, Contracts & Schema (mapped to ShipTrack)
TeamID: TODO | Name/Roll: TODO

CampusEats asked for `design.pdf, services.drawio+png, schema.drawio+png+sql`. Same content lives here:

## 1. Capabilities (≥6 verbs)
From `docs/architecture.md:52-65` + `README.md:40-53`: register/login/RBAC, manage customer+carrier profiles, getQuote, createShipment, trackPublic/listHistory, recordEvent/latest, updateStatus/assignCarrier, currencyConvert/countryInfo, analytics aggregate, audit, notify, GraphQL dashboard.

## 2. Service design (3–6 boxes → we have 12, boundary holds)
Diagram: `docs/architecture.md:5-48` (mermaid flowchart) + editable `docs/diagrams/use-case-diagram.drawio` + `.png`, `data-flow-diagram.drawio`.
Each box owns its data, no sharing:

| Service | Port | Owns (DB) |
|---|---|---|
| auth | 8001 | Postgres `auth_db` |
| user | 8002 | Postgres `user_db` |
| carrier | 8003 | Postgres `carrier_db` |
| shipment | 8004 | Postgres `shipment_db` |
| tracking | 8005 | Mongo `tracking_db` |
| pricing | 8006 | MySQL `pricing_db` |
| location | 8007 | MySQL `location_db` |
| crm | 8008 | Mongo `crm_db` |
| audit | 8009 | Mongo `audit_db` |
| notification | 8010 | — (SMTP/log) |
| graphql | 8011 | — (aggregator) |
| gateway | 8000 | — (routing) |

Cross-service arrows: `Shipment → Pricing: POST /pricing/quote`, `Shipment → Tracking: POST /tracking/:id/events` (`services/shipment-service/src/clients/`), `Pricing → Location: SOAP GetCountryInfo` (`services/pricing-service/src/soap/countryClient.js`), `GraphQL → Shipment/Tracking/User: REST`. Member per service: TODO (add names to boxes before submitting).

## 3. Contracts (operation, input, output, errors — no tables/SQL)
In `services/*/openapi.yaml` (12 files). Two main examples:
- **shipment-service** (7 ops): `POST /shipments` in `{origin, destination, weightKg, packageType, currency}` out `201 Shipment`, errors `400/401/403/409/503`; `GET /{id}` out `200`, errors `403/404`; `PATCH /{id}/status` in `{status, expectedVersion}` errors `412/422`.
- **tracking-service** (3 ops): `POST /{trackingId}/events` in `{status, location, note}` out `201 TrackingEvent`, errors `400`; `GET /{trackingId}/events?cursor&limit` out `200`; `GET /{trackingId}/latest` out `200`, errors `404`.
Swagger: `http://localhost:18000/api-docs` + per-service `http://localhost:<8001-8010>/api-docs`.

## 4. Central operation — `placeOrder` → `POST /api/v1/shipments createShipment`
Code: `services/shipment-service/src/controllers/shipmentController.js:11-18` + `src/services/shipmentService.js`. Spec in `services/shipment-service/openapi.yaml` (`/api/v1/shipments` POST).
- **In:** `{origin{address,city,country}, destination{…}, weightKg, packageType, currency}` + JWT + `Idempotency-Key` header.
- **Out:** `201 {id, trackingId, quotedPrice, currency, estimatedDeliveryDate, version}`.
- **Errors:** `400` malformed, `401/403` auth, `409` same key+different body (`common/src/idempotency.js:29`), `503` pricing/tracking down.
- **Hidden:** Postgres table, UUID/trackingId gen, pricing SOAP call, tracking best-effort POST, optimistic-concurrency `version`.

## 5. Database schema (ER + CREATE TABLE)
- ER: `docs/diagrams/er-diagram.drawio` + `.png`, `schema-diagram.drawio` + `.png`, `docs/er-diagrams.md`.
- SQL: `infra/postgres-init/01-create-databases.sql`, `infra/mysql-init/01-create-databases.sql`, per-service `src/db/migrate.js`.
- Rule holds: no table belongs to two services (see ownership table above). Verify: `docker exec -it shiptrack-node-postgres psql -U shiptrack -d shipment_db \dt` (creds `RUNBOOK.md §4`).

## 6. Five service properties
Reachable (own port + gateway route) · self-contained (own DB, no cross `store` import) · contract (`openapi.yaml` + `/api-docs`) · independent (own Dockerfile) · loosely-coupled (only `createServiceClient` HTTP via env URLs in `common/src/httpClient.js`). Known fix: frontend `nginx.conf proxy_pass` must be repointed on Render (deployment guide).
