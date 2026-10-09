# ShipTrack — Run Commands & Credentials

Everything needed to bring the platform up, log in, and fix it when it breaks.
All URLs and credentials below were verified live against the running stack on 2026-09-03.

> Credentials here are the **local development defaults** from `.env` (already committed as
> `.env.example`). They are not secrets. Change `JWT_SECRET`, `JWT_REFRESH_SECRET` and
> `ADMIN_PASSWORD` before deploying anywhere real.

---

## 1. Prerequisites

- Docker Desktop + Docker Compose v2
- Node.js >= 20 (only needed for running tests / frontend outside Docker)
- **Docker Desktop is not running by default on this machine.** Start it and wait:

```bash
open -a Docker
until docker info >/dev/null 2>&1; do sleep 3; done
```

---

## 2. Start the whole platform

```bash
cd "/Users/nandankabra/Desktop/IIIT /sem 3 /webservices/shipment1212"

cp .env.example .env          # first time only — skip if .env already exists
cp .env.example .env    # first run; use `docker compose up -d` afterwards
cp .env.example .env              # wait until all 16 containers report "healthy"
```

First boot takes a few minutes (image builds + DB init + admin seeding).
Expect **16 containers**: 12 services + Postgres + MySQL + MongoDB + frontend.

### ⚠️ Before starting: free up memory

The Docker VM has **7.75 GB**. The archived Java stack from `legacy-java-backup/`
(compose project `shiptrack-platform` — 13 containers, ~3.6 GB of JVMs + Kafka) is enough on its
own to push this stack past the limit, and the OOM killer then kills all 16 Node containers
(they exit **137**). Docker Desktop restores whatever was running when it last shut down, so
the legacy stack tends to reappear after a Docker restart. Stop it before starting this one:

```bash
docker compose -p shiptrack-platform -f legacy-java-backup/docker-compose.yml stop
```

Its containers are named `shiptrack-<service>` — note the **absence** of `-node-`, which is what
distinguishes them from this stack's `shiptrack-node-<service>`.

To bring the legacy stack back later, swap `stop` for `up -d` in the same command.

---

## 3. URLs

| What | URL | Verified |
|---|---|---|
| **Frontend (all 3 portals)** | http://localhost:3001 | 200 |
| **API Gateway + Swagger UI** | http://localhost:18000/api-docs | 200 |
| **GraphQL / Apollo Sandbox** | http://localhost:8011/graphql | 200 |
| GraphQL via gateway | http://localhost:18000/graphql | — |
| SOAP WSDL — country | http://localhost:8007/wsdl/country?wsdl | 200 |
| SOAP WSDL — currency | http://localhost:8006/wsdl/currency?wsdl | 200 |

### Per-service Swagger UI — `http://localhost:<port>/api-docs`

| Service | Port | Swagger | Database |
|---|---|---|---|
| api-gateway | 18000 (host) → 8000 | ✅ | — |
| auth-service | 8001 | ✅ | PostgreSQL |
| user-service | 8002 | ✅ | PostgreSQL |
| carrier-service | 8003 | ✅ | PostgreSQL |
| shipment-service | 8004 | ✅ | PostgreSQL |
| tracking-service | 8005 | ✅ | MongoDB |
| pricing-service | 8006 | ✅ | MySQL |
| location-service | 8007 | ✅ | MySQL |
| crm-service | 8008 | ✅ | MongoDB |
| audit-service | 8009 | ✅ | MongoDB |
| notification-service | 8010 | ✅ | — |
| graphql-service | 8011 | ❌ **no `/api-docs`** — use `/graphql` | — |

Databases on the host: Postgres `localhost:15432`, MySQL `localhost:13306`, Mongo `localhost:27019`.

> Ports are deliberately non-standard (18000 / 3001 / 27019 / 15432 / 13306) because other
> Docker projects on this machine already hold 8000, 3000, 5173 and 27018. Override any of them
> in `.env`: `GATEWAY_HOST_PORT`, `FRONTEND_HOST_PORT`, `POSTGRES_HOST_PORT`,
> `MYSQL_HOST_PORT`, `MONGO_HOST_PORT`.

---

## 4. Login credentials

### Admin (seeded automatically on first boot)

| Field | Value |
|---|---|
| **Email** | `admin@shiptrack.local` |
| **Password** | `Admin@12345` |
| Role | `ADMIN` |

Seeded by `services/auth-service/src/db/seed.js` from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`,
only if that email doesn't already exist. Log in at http://localhost:3001 → admin portal.

Verify from the CLI:

```bash
curl -s -X POST http://localhost:18000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@shiptrack.local","password":"Admin@12345"}'
```

Returns `{ user, accessToken, refreshToken }`. Access tokens expire in **15m**, refresh in **7d**.

### Customer — self-register (no seeded account)

Register through the UI at http://localhost:3001, or:

```bash
curl -s -X POST http://localhost:18000/api/v1/auth/register \
  -H 'content-type: application/json' \
  -d '{"name":"Test Customer","email":"customer@example.com","password":"Customer@123"}'
```

Password rules: 8–72 characters. Self-registration always creates role `CUSTOMER`.

### Carrier — must be provisioned by an admin (no self-registration)

```bash
# 1. get an admin token
TOKEN=$(curl -s -X POST http://localhost:18000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@shiptrack.local","password":"Admin@12345"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["accessToken"])')

# 2. create the carrier account
curl -s -X POST http://localhost:18000/api/v1/auth/admin/accounts \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{"name":"Test Carrier","email":"carrier@example.com","password":"Carrier@123","role":"CARRIER"}'
```

`role` accepts only `CARRIER` or `ADMIN`. Then log in at http://localhost:3001 with those details.

One carrier account already exists in the current database (created by the command above):

| Field | Value |
|---|---|
| **Email** | `runbook-carrier@example.com` |
| **Password** | `Carrier@123` |
| Role | `CARRIER` |

It lives in the Postgres volume, so it survives `docker compose down` but **not** `down -v`.

### Database credentials (from `.env`)

| Database | Host:Port | User | Password |
|---|---|---|---|
| PostgreSQL | `localhost:15432` | `shiptrack` | `shiptrack` |
| MySQL | `localhost:13306` | `shiptrack` (root pw `root`) | `shiptrack` |
| MongoDB | `localhost:27019` | *(no auth)* | — |

```bash
docker exec -it shiptrack-node-postgres psql -U shiptrack -d auth_db
docker exec -it shiptrack-node-mysql mysql -ushiptrack -pshiptrack pricing_db
docker exec -it shiptrack-node-mongo mongosh tracking_db
```

Postgres databases: `auth_db`, `user_db`, `carrier_db`, `shipment_db`.
MySQL: `pricing_db`, `location_db`. Mongo: `tracking_db`, `crm_db`, `audit_db`.

### Roles

- **Guest** — public tracking lookup, no login.
- **CUSTOMER** — self-register; create shipments, get quotes, track, view history, manage profile.
- **CARRIER** — admin-provisioned; claim unassigned shipments, update status, add tracking events.
- **ADMIN** — manage customers/carriers/shipments, CRM analytics, audit logs, provision carriers.

---

## 5. Day-to-day commands

```bash
docker compose ps                          # health of every container
docker compose logs -f                     # tail everything
docker compose logs -f shipment-service    # tail one service
docker compose restart api-gateway         # restart one service
docker compose up -d --build auth-service  # rebuild one after a code change
docker compose stop                        # stop, keep containers
docker compose down                        # remove containers + network, KEEP data
docker compose down -v                     # also WIPE all databases (admin re-seeds on next boot)
```

---

## 6. Tests (no Docker needed)

Every service mocks its DB/outbound-client layer, so the suite runs with nothing running:

```bash
npm install
npm test --workspaces --if-present
```

---

## 7. Running pieces natively (no Docker)

```bash
npm install
docker compose up -d postgres mysql mongo        # databases still needed
npm run dev --workspace frontend                 # Vite dev server on :5173
npm start --workspace services/auth-service      # or `npm run dev` for node --watch
```

Export the env vars from each service's own `.env.example` when running services natively.

---

## 8. Troubleshooting

These are real failures hit on this machine, with the fixes that worked.

### All containers exit with code **137**

The Docker VM ran out of memory (7.75 GB total). The archived Java stack takes ~3.6 GB of it and
gets restored by Docker Desktop after a restart. Stop it — see [§2](#️-before-starting-free-up-memory)
— then `docker compose up -d`. Check usage with:

```bash
docker stats --no-stream --format "{{.Name}}\t{{.MemUsage}}"
```

### Services die with `getaddrinfo ENOTFOUND postgres` (or `mysql` / `mongo`)

The database container is running but **attached to no Docker network** — it happens when its
port bind fails during network setup, and a plain `docker compose up -d` won't fix it because
compose sees the container as already running. Diagnose and fix:

```bash
docker inspect shiptrack-node-postgres --format '{{json .NetworkSettings.Networks}}'
# if this prints "{}" the container has no network:
docker compose up -d --force-recreate postgres
docker compose up -d
```

Force-recreating a DB container does **not** wipe its data — that lives in a named volume.

### `Bind for 0.0.0.0:15432 failed: port is already allocated`

The legacy Java stack's `shiptrack-postgres` grabbed the port (note: **no** `-node-` in the name).

```bash
docker ps --format "{{.Names}}\t{{.Ports}}" | grep 15432
docker stop shiptrack-postgres
```

Same pattern for any other port — check the holder before changing `.env`.

### Only some containers come back after a Docker Desktop restart

`docker-compose.yml` sets **no `restart:` policy**, so nothing auto-restarts. Just run
`docker compose up -d` again. To make it automatic, add `restart: unless-stopped` to each service.

### Postgres logs spam `FATAL: database "shiptrack" does not exist`

Harmless — the healthcheck connects with user `shiptrack` and no explicit database. The
containers still report healthy.

---

## 9. Known limitations

- **Render deployment is unverified** — `render.yaml` is written to spec but has never been
  deployed end to end (no Render account). See `docs/deployment-guide.md`; the frontend's
  `nginx.conf` `proxy_pass` must be repointed at the public gateway URL before deploying.
- Coverage thresholds are configured per service but not enforced as a CI gate.
