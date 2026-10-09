# Assignment 1 — HTTP by Hand & Project Setup (mapped to ShipTrack)
TeamID: TODO | Name/Roll: TODO

CampusEats asked for `http-log.md, network-analysis.md, README, brief.md`. This file is the ShipTrack completion of the same pattern.

## 1. Five `curl -i` requests (one is a deliberate 404)
Stack must be up first:
```bash
cp .env.example .env
docker compose up -d --build
docker compose ps   # 16 containers healthy
```

| # | Command | Expected status + Content-Type meaning |
|---|---|---|
| 1 | `curl -i -X POST http://localhost:18000/api/v1/auth/login -H 'content-type: application/json' -d '{"email":"admin@shiptrack.local","password":"Admin@12345"}'` | `200 OK`, `application/json` = success, returns `{user, accessToken, refreshToken}`. Source: `RUNBOOK.md §4`, `services/auth-service/openapi.yaml` |
| 2 | `curl -i http://localhost:18000/api/v1/shipments/track/STKABC123` | `200 OK` public tracking lookup (guest, no auth). `services/shipment-service/openapi.yaml` `/track/{trackingId}` |
| 3 | `curl -i http://localhost:18000/api/v1/tracking/STKABC123/events` | `200 OK` paginated tracking-event list. `services/tracking-service/openapi.yaml` |
| 4 | `curl -i http://localhost:18000/api/v1/tracking/UNKNOWN/latest` | `404 NOT_FOUND`, `application/json` = resource does not exist. Thrown in `services/tracking-service/src/services/trackingEventService.js:33`, shaped by `common/src/errors.js` |
| 5 | `curl -i -X POST http://localhost:18000/api/v1/tracking/STKABC123/events -H 'content-type: application/json' -d '{"status":"NOT_A_STATUS"}'` | `400 BAD_REQUEST` = AJV validation failed (`src/middleware/schemas.js`, `validate()` in `src/routes/trackingRoutes.js:11`). Proved by test `tests/tracking.routes.test.js:28-33` |

Full collection: `postman/ShipTrack.postman_collection.json`. Swagger: `http://localhost:18000/api-docs`.

## 2. Network analysis (DevTools waterfall)
1. Open `http://localhost:3001` (frontend in `frontend/`)
2. F12 → Network → tick **Disable cache** → reload
3. Record: request count (bottom bar), total MB transferred, slowest resource (Time column — usually the JS bundle or `/graphql`), any `304` (ETag hit), `404`, `429` (rate limit from `@shiptrack/common` rateLimiter, see `tracking-service/src/app.js:10`)

## 3. Git repository
- Remote: `git@github.com:nandankabra/wsexpress.git` (`git remote -v`)
- Structure: `README.md` (123 lines), `docs/` (`architecture.md`, `er-diagrams.md`, `deployment-guide.md`, `diagrams/`), `services/<name>/`, `frontend/`, `docker-compose.yml`
- History is incremental, not one final commit: `git log --oneline -20` shows e.g. `a62397a Add shipment-service`, `fbd5b25 Add location-service`, `64c5475 Add graphql-service`, `24fce83 Add api-gateway`

## 4. Brief (what / who / nouns / verbs)
- **What:** logistics platform — 12 Node/Express microservices behind API Gateway (`README.md:1-7`, `docs/architecture.md`). REST + GraphQL + SOAP, JWT/RBAC, Postgres+MySQL+Mongo.
- **Who:** Guest (public tracking), CUSTOMER (register, create, quote, track), CARRIER (admin-provisioned; claim, update status, add events), ADMIN (manage, analytics, audit). See `README.md:60-67`, `RUNBOOK.md §4`.
- **Nouns:** User, Carrier, Shipment, TrackingEvent, Quote/PricingRule, Country/City/Warehouse/Route, AnalyticsRecord, AuditLog, Notification.
- **Verbs:** register/login, createShipment, getQuote, trackPublic, recordEvent, updateStatus, assignCarrier, verifyCarrier, aggregateDashboard, audit, notify.
