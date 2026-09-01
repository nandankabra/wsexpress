# ShipTrack — Professor Demonstration Guide

## 1. Architecture Overview

ShipTrack is 10 independently deployable Spring Boot microservices behind a single API Gateway,
with Eureka for service discovery and a Config Server for centralized configuration. Services
communicate synchronously via REST/OpenFeign (and one SOAP hop inside Quote→Country) and
asynchronously via Kafka (Shipment/Tracking → Notification). See
[docs/diagrams.md](docs/diagrams.md) for the full architecture, sequence, ER, deployment and class
diagrams. High-level shape:

```
Client → API Gateway → { Auth, Shipment, Tracking, Quote, Country, GraphQL, Notification }
                              ↑ all register with Eureka, pull config from Config Server
Shipment/Tracking --(Kafka)--> Notification
Quote --(REST, backed by SOAP)--> Country
GraphQL --(REST fan-out)--> Shipment, Tracking, Quote, Country
```

## 2. Service Responsibilities

| Service | Responsibility |
|---|---|
| API Gateway | Single entry point; JWT verification; correlation IDs; rate limiting; circuit-breaker fallback; request logging |
| Eureka Discovery Server | Service registry — every other service registers and discovers peers here |
| Config Server | Serves shared config (JWT secret, Eureka URL, actuator/logging defaults) to every service from one place |
| Auth Service | User registration/login, JWT issuing, RBAC (ADMIN/MANAGER/VIEWER), token validation |
| Shipment Service | Shipment CRUD with ETag, optimistic locking, idempotency keys, pagination, XML/JSON negotiation, Cache-Control |
| Tracking Service | Tracking event history, cursor pagination, simulated carrier webhook ingestion |
| Quote Service | Carrier price quotes; calls Country Service (SOAP-backed) with retry/timeout/circuit-breaker |
| Country Service | Contract-first SOAP endpoint (WSDL/XSD) + generated SOAP client + REST wrapper for country/currency metadata |
| GraphQL Service | Single GraphQL API fanning out to Shipment/Tracking/Quote/Country over REST |
| Notification Service | Consumes Kafka events from Shipment/Tracking, simulates notification delivery, exposes history |

## 3. Port Mapping Table

| Service | Container port | Host port | Notes |
|---|---|---|---|
| API Gateway | 8080 | **18080** | 8080 was already used by unrelated software on the demo machine |
| Eureka Discovery Server | 8761 | 8761 | |
| Config Server | 8888 | 8888 | |
| Auth Service | 8081 | 8081 | |
| Shipment Service | 8082 | 8082 | |
| Tracking Service | 8083 | 8083 | |
| Quote Service | 8084 | 8084 | |
| Country Service | 8085 | 8085 | |
| GraphQL Service | 8086 | 8086 | |
| Notification Service | 8087 | 8087 | |
| PostgreSQL | 5432 | **15432** | 5432 was already used by a native Postgres install on the demo machine |
| MongoDB | 27017 | 27017 | |
| Redis | 6379 | 6379 | |
| Kafka | 9092 / 29092 | 9092 / 29092 | 9092 for in-network clients, 29092 for host clients |

Every service still listens on its **required** container-internal port; only two host-side
publish ports were changed, purely to avoid colliding with unrelated software already running on
the demo machine. This does not affect inter-service traffic (which always uses the Docker network
hostnames, e.g. `postgres:5432`).

## 4. Database Design

**PostgreSQL** — one container, three databases (database-per-service):
- `auth_db`: `users`, `roles`, `user_roles`
- `shipment_db`: `shipments`, `idempotency_keys`, `audit_logs`
- `quote_db`: `quotes`

All three are schema-versioned with Flyway (`V1__init_*.sql` per service).

**MongoDB** — one container, database `tracking_db`, three collections:
- `tracking_events` — the normalized domain event history
- `carrier_payloads` — raw inbound webhook payloads (audit/replay)
- `request_audit` — one row per mutating HTTP request Tracking Service handled

Full ER/collection diagrams: [docs/diagrams.md](docs/diagrams.md) sections 6–7.

## 5. API Gateway Flow

Every client request enters through the gateway (`localhost:18080`), which:
1. Assigns/propagates `X-Correlation-Id` (`CorrelationIdGlobalFilter`)
2. Logs method/path/status/latency (`LoggingGlobalFilter`)
3. Verifies the JWT for any non-public path, injecting `X-User-Id`/`X-User-Roles`/`X-User-Email`
   for downstream services to trust (`JwtAuthenticationGlobalFilter`)
4. Applies a Redis-backed rate limiter per route
5. Routes to the target service via Eureka (`lb://SERVICE-NAME`), wrapped in a circuit breaker
   that falls back to `/fallback/{service}` (503) if the service is down/overloaded

Public (no-JWT-required) paths: `/api/auth/register`, `/api/auth/login`, `/api/auth/validate`,
`/api/webhooks/**`, `/actuator/**`, `/fallback/**`.

## 6. JWT Flow

1. `POST /api/auth/register` creates a user with one or more roles (ADMIN/MANAGER/VIEWER)
2. `POST /api/auth/login` verifies the password (BCrypt) and issues an HS256 JWT containing
   `sub` (email), `userId`, `email`, `roles` claims, signed with a secret shared (via Config
   Server) between Auth Service and the Gateway
3. The Gateway verifies the signature/expiry on every protected request — it does **not** call
   Auth Service per request; verification is local and fast
4. `GET /api/auth/validate` exists for any client that wants to explicitly check a token
   (e.g. outside the gateway)
5. `GET /api/auth/users` demonstrates RBAC: only a JWT carrying `ROLE_ADMIN` may call it

See [docs/diagrams.md](docs/diagrams.md) §2 for the sequence diagram.

## 7. SOAP Flow

Country Service is contract-first: `countries.xsd` defines the wire format; `jaxb2-maven-plugin`
generates Java request/response classes from it at build time (`com.shiptrack.country.wsdl`);
`WebServiceConfig` publishes a real WSDL at `/ws/countries.wsdl`; `CountryEndpoint` implements the
`@PayloadRoot`-mapped operations, throwing a `@SoapFault`-annotated exception for unknown country
codes. `SoapCountryClient` (a `WebServiceTemplate` + `Jaxb2Marshaller` "generated client") is used
by `CountryRestController`, so **every REST call to Country Service genuinely round-trips through
a real SOAP request/response** — it's not a REST-only shortcut with SOAP bolted on for show.

## 8. GraphQL Flow

`graphql-service` exposes one endpoint, `POST /api/graphql` (GraphiQL at `/graphiql`), backed by
`schema.graphqls`. Queries (`shipment`, `shipments`, `trackingEvents`, `countryInfo`, `quote`) and
mutations (`createShipment`, `createTrackingEvent`) are resolved by `@Controller` classes that fan
out to the REST APIs of Shipment/Tracking/Quote/Country via OpenFeign — GraphQL Service holds no
data of its own.

## 9. ETag Flow

`Shipment.etag()` derives a strong ETag directly from the entity's id and JPA `@Version`
(`"id-version"`), so any successful update automatically changes the ETag. `GET
/api/shipments/{id}` compares an incoming `If-None-Match` against the current ETag and returns
`304 Not Modified` (empty body) on a match, `200` with the full representation and a fresh ETag
otherwise.

## 10. Idempotency Flow

`POST /api/shipments` accepts an `Idempotency-Key` header. The first call with a given key hashes
the request body, creates the shipment, and stores `(key, hash, response)` in `idempotency_keys`.
A retried call with the same key **and** the same body replays the stored response as `200 OK`
instead of creating a duplicate; the same key with a **different** body is rejected as `409
Conflict`.

## 11. Circuit Breaker Flow

Two layers:
- **Gateway**: every route wraps its downstream call in a Resilience4j circuit breaker
  (`spring-cloud-starter-circuitbreaker-reactor-resilience4j`); once open, requests are forwarded
  to `/fallback/{service}`, which returns a `503` RFC9457 problem body instead of hanging or
  propagating a raw connection error.
- **Quote Service**: `CountryLookupService.lookup()` is annotated `@CircuitBreaker(name =
  "countryService", fallbackMethod = "fallbackCountry")` — when Country Service is down, quotes
  keep working using fallback pricing metadata instead of failing outright.

**Live demo**: `docker stop shiptrack-country-service`, then repeatedly `POST /api/quotes`. Verified
behavior: the first call after Country Service goes down takes a few seconds while the configured
retry/timeout play out (occasionally slow enough to also trip the *Gateway's own* circuit breaker
for Quote Service, returning a 503 from `/fallback/quote` instead) — every call after that is
near-instant (single-digit milliseconds), served by Quote Service's own `fallbackCountry(...)`
pricing metadata, because its circuit breaker is now open. `docker start shiptrack-country-service`
to restore normal pricing.

## 12. Retry Flow

`CountryLookupService.lookup()` also carries `@Retry(name = "countryService")`, configured for 2
attempts with a 200ms backoff on `IOException`/`feign.RetryableException` — transient network
blips to Country Service are retried before the circuit breaker or fallback even gets involved.
Kept deliberately short (worst case well under 2s) so a struggling Country Service trips Quote
Service's *own* circuit breaker before the Gateway's coarser 5s route timeout would otherwise
consider Quote Service itself unresponsive.

## 13. Pagination Flow

- **Offset pagination** (Shipment, Quote, Auth users): standard Spring Data `Pageable` —
  `?page=0&size=20&sort=createdAt,desc`, response wrapped in a `Page<T>` envelope
  (`content`, `totalElements`, `totalPages`, …).
- **Cursor pagination** (Tracking events): `GET /api/events?cursor=<lastId>&limit=20` — ordered by
  MongoDB `_id` descending (time-ordered), immune to skipped/duplicated rows under concurrent
  inserts, unlike offset pagination. Response: `{"items": [...], "nextCursor": "...", "hasMore": true}`.

## 14. MongoDB Flow

Tracking Service is the only MongoDB-backed service. `TrackingEvent` documents are written on
every internal event (`POST /api/events`) and every simulated carrier webhook (`POST
/api/webhooks/carrier`), the latter also archiving the raw payload to `carrier_payloads`.
`RequestAuditFilter` writes one `request_audit` row per mutating HTTP call, independent of
business events — a good talking point for "how would you add cross-cutting audit logging without
touching every controller."

## 15. PostgreSQL Flow

Auth, Shipment and Quote each own a dedicated PostgreSQL database (`auth_db`, `shipment_db`,
`quote_db`) inside one shared Postgres container — classic database-per-service, avoiding
cross-service coupling at the schema level. Every schema is created and versioned by Flyway
migrations checked into each service's `src/main/resources/db/migration`, not by
Hibernate `ddl-auto` — so schema changes are explicit, reviewable, and reproducible.

## 16. Docker Deployment

Every service has its own multi-stage `Dockerfile` (Maven-build stage → slim
`eclipse-temurin:21-jre-alpine` runtime stage, running as a non-root user). `docker-compose.yml`
wires all 10 services plus Postgres/Mongo/Redis/Kafka with explicit healthchecks and `depends_on:
condition: service_healthy`, so `docker compose up -d` brings the whole platform up in the correct
order automatically.

```bash
docker compose build
docker compose up -d
docker compose ps      # everything should show "healthy"
```

## 17. Swagger Demonstration

Every REST-based service (Auth, Shipment, Tracking, Quote, Country, Notification) exposes
Springdoc OpenAPI. From the host:

```
http://localhost:8081/swagger-ui.html   # Auth
http://localhost:8082/swagger-ui.html   # Shipment
http://localhost:8083/swagger-ui.html   # Tracking
http://localhost:8084/swagger-ui.html   # Quote
http://localhost:8085/swagger-ui.html   # Country
http://localhost:8087/swagger-ui.html   # Notification
```

Raw OpenAPI JSON is at `/v3/api-docs` on each of the same ports.

## 18. Requirement Traceability Matrix

See **[REQUIREMENT_TRACEABILITY_MATRIX.md](REQUIREMENT_TRACEABILITY_MATRIX.md)** — all 28
requirements mapped to service, class, endpoint, demonstration method and verification steps.

## 19. Complete curl Commands

All commands below were run against the live `docker compose` stack and produced the shown output.

```bash
GW="http://localhost:18080"

# 1. Register a user
curl -X POST "$GW/api/auth/register" -H "Content-Type: application/json" \
  -d '{"email":"manager@shiptrack.dev","password":"Manager@123","fullName":"Demo Manager","roles":["MANAGER"]}'
# => {"id":2,"email":"manager@shiptrack.dev","fullName":"Demo Manager","enabled":true,"roles":["MANAGER"],...}

# 2. Log in as the seeded admin
curl -X POST "$GW/api/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"admin@shiptrack.dev","password":"Admin@123"}'
# => {"token":"eyJhbGciOiJIUzM4NCJ9...","tokenType":"Bearer","expiresInMs":3600000,"userId":1,"roles":["ADMIN"]}
TOKEN="<paste the token here>"

# 3. Create a shipment (idempotent)
curl -i -X POST "$GW/api/shipments" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -H "Idempotency-Key: demo-key-001" \
  -d '{"senderName":"Alice","senderAddress":"1 Main St","receiverName":"Bob","receiverAddress":"2 Elm St","originCountryCode":"US","destinationCountryCode":"GB","weightKg":4.5}'
# => 201 Created, ETag: "1-0", Location: /api/shipments/1

# 4. Replay the same Idempotency-Key + body -> 200, same shipment, no duplicate
curl -i -X POST "$GW/api/shipments" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -H "Idempotency-Key: demo-key-001" \
  -d '{"senderName":"Alice","senderAddress":"1 Main St","receiverName":"Bob","receiverAddress":"2 Elm St","originCountryCode":"US","destinationCountryCode":"GB","weightKg":4.5}'
# => 200 OK

# 5. Conditional GET -> 304
curl -i "$GW/api/shipments/1" -H "Authorization: Bearer $TOKEN" -H 'If-None-Match: "1-0"'
# => 304 Not Modified

# 6. PATCH without If-Match -> 412
curl -i -X PATCH "$GW/api/shipments/1" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"IN_TRANSIT"}'
# => 412 Precondition Failed

# 7. PATCH with correct If-Match -> 200, version bumps to 1
curl -X PATCH "$GW/api/shipments/1" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -H 'If-Match: "1-0"' -d '{"status":"IN_TRANSIT"}'
# => {"...","status":"IN_TRANSIT","version":1}

# 8. Record a tracking event
curl -X POST "$GW/api/events" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"shipmentId":1,"trackingNumber":"ST-0FC1E7A6","eventType":"PICKED_UP","location":"New York Hub","description":"Package picked up"}'

# 9. Simulate a carrier webhook
curl -X POST "$GW/api/webhooks/carrier" -H "Content-Type: application/json" \
  -d '{"carrierId":"FEDEX-SIM","trackingNumber":"ST-0FC1E7A6","shipmentId":1,"status":"IN_TRANSIT","location":"Chicago Hub","note":"In transit"}'

# 10. Full tracking history for a shipment (Tracking Service, routed by the gateway)
curl "$GW/api/shipments/1/events" -H "Authorization: Bearer $TOKEN"

# 11. Cursor-paginated event feed
curl "$GW/api/events?limit=5" -H "Authorization: Bearer $TOKEN"

# 12. Request a quote (exercises Country Service via a real SOAP round trip)
curl -X POST "$GW/api/quotes" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"originCountryCode":"US","destinationCountryCode":"GB","weightKg":4.5}'
# => {"amount":52.50,"currency":"GBP",...}

# 13. GraphQL: query across two services in one call
curl -X POST "$GW/api/graphql" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"query":"query { shipment(id: \"1\") { trackingNumber status } countryInfo(code: \"GB\") { name currencyCode capital } }"}'

# 14. GraphQL: mutation
curl -X POST "$GW/api/graphql" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"query":"mutation { createShipment(input: {senderName: \"Carol\", senderAddress: \"3 Oak St\", receiverName: \"Dave\", receiverAddress: \"4 Pine St\", originCountryCode: \"DE\", destinationCountryCode: \"IN\", weightKg: 2.0}) { id trackingNumber status } }"}'

# 15. Raw SOAP WSDL (direct to Country Service)
curl http://localhost:8085/ws/countries.wsdl

# 16-17. Security: no token / bad token -> 401
curl -o /dev/null -w "%{http_code}\n" "$GW/api/shipments"
curl -o /dev/null -w "%{http_code}\n" "$GW/api/shipments" -H "Authorization: Bearer garbage.token.here"

# 18. RBAC: non-admin hitting an admin-only endpoint -> 403
curl -o /dev/null -w "%{http_code}\n" "$GW/api/auth/users" -H "Authorization: Bearer <manager token>"

# 19. Notification history (proves the Kafka pipeline actually ran)
curl "$GW/api/notifications?limit=10" -H "Authorization: Bearer $TOKEN"
```

## 20. Viva Questions and Answers

**Q: Why does the Gateway inject `X-User-Id`/`X-User-Roles` instead of every service re-verifying
the JWT?**
A: It's the standard edge-authentication pattern — verification happens once, at the edge, and
downstream services trust the gateway within the internal network. Auth Service is the one
exception, since it must be able to validate tokens directly (`/api/auth/validate`) even for
clients that bypass the gateway.

**Q: Why is the ETag literally `"id-version"` instead of a content hash?**
A: It ties the ETag directly to JPA's own optimistic-locking `@Version` column — any successful
write increments both together, so ETag correctness is guaranteed by the same mechanism that
guarantees no lost updates, with zero extra bookkeeping.

**Q: What's the difference between the 412 you get from a missing `If-Match` and the 412 from a
stale one?**
A: Both are the same status code but different causes: a missing header means the client didn't
attempt a safe conditional update at all; a present-but-stale header means the client read the
resource, it changed underneath them, and the write was correctly refused. Both are surfaced via
the same `PreconditionFailedException` → RFC9457 problem body, with a message that distinguishes
the two.

**Q: Why cursor pagination for tracking events but offset pagination for shipments?**
A: Tracking events are high-volume, insert-heavy, and read newest-first — offset pagination would
skip or repeat rows as new events arrive between page requests. Shipments are edited in place and
queried more like a traditional table, where offset/page/sort is the more natural, more
feature-rich fit (arbitrary sort fields, jump-to-page).

**Q: Why does Quote Service call Country Service over REST instead of directly over SOAP?**
A: Country Service *is* the SOAP boundary — it owns the WSDL/XSD contract and the SOAP client
internally. Other services consume it over REST so they don't need SOAP/JAXB tooling on their own
classpath; the REST call still genuinely round-trips through a real SOAP request/response inside
Country Service, so nothing about the SOAP requirement is faked.

**Q: What happens if Kafka is down when a shipment is created?**
A: The shipment write itself still succeeds — Kafka publish happens after the transaction commits
and is fire-and-forget (`KafkaTemplate.send(...).whenComplete(...)` just logs a warning on
failure). This is a deliberate trade-off: notifications are best-effort, not a source of truth, so
they must never block or fail the primary business operation.

**Q: Why native Config Server instead of git-backed?**
A: It removes an external dependency (a git remote) for a class project that needs to be runnable
standalone; the mechanics being demonstrated — centralized config, environment overrides via
`spring.config.import=configserver:`, shared secrets — are identical either way.

**Q: How would you scale this to production?**
A: Each service is already independently deployable and stateless (session state lives in the
JWT, not server memory), so horizontal scaling is just adding replicas behind the load balancer
Eureka already provides. The main things that would need to change: a managed secrets store instead
of plaintext config for the JWT secret, mutual TLS or a service mesh instead of trusting the
gateway's injected headers over the network, and Kafka consumer groups already give you
notification-processing parallelism for free.

## 21. End-Sem Presentation Notes

Suggested 10–12 minute flow:
1. **30s** — one-line pitch: "10 Spring Boot microservices, one gateway, real JWT/SOAP/GraphQL/Kafka."
2. **1 min** — architecture diagram (docs/diagrams.md §1), name every service and its datastore.
3. **1 min** — `docker compose up -d` already running; `docker compose ps` shows everything healthy.
4. **3 min** — live curl walkthrough: login → create shipment (show ETag/Location headers) →
   conditional GET (304) → PATCH with stale If-Match (412) → PATCH with correct If-Match (200).
5. **2 min** — quote request; point out it silently did a SOAP round-trip; show the WSDL directly.
6. **2 min** — GraphQL query joining two services in one call; then a mutation.
7. **1 min** — notification history endpoint, tie it back to the Kafka event that triggered it.
8. **1 min** — Swagger UI on one service, Eureka dashboard showing all registrations.
9. **1 min** — open the traceability matrix, point at a couple of rows the professor asks about.

Have a second terminal ready with `docker compose logs -f api-gateway` filtered to show
correlation IDs flowing through — it's a strong visual for "this is a real distributed system,
not a monolith with folders."

## 22. Step-by-Step Project Demo Script

```bash
# 0. From a clean checkout
cd shipment1212
docker compose build            # ~2-3 min first time, seconds after (BuildKit cache)
docker compose up -d
watch docker compose ps         # wait for all 14 containers to show "healthy"

# 1. Prove discovery works
curl http://localhost:8761/eureka/apps | grep -o '<name>[A-Z-]*</name>'

# 2. Auth
curl -X POST http://localhost:18080/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@shiptrack.dev","password":"Admin@123"}'
# copy the token into $TOKEN for every following call

# 3. Shipment lifecycle (see section 19, commands 3-7)

# 4. Tracking (see section 19, commands 8-11)

# 5. Quote / SOAP (see section 19, command 12, then command 15 for the raw WSDL)

# 6. GraphQL (see section 19, commands 13-14)

# 7. Notification / Kafka proof (see section 19, command 19)

# 8. Security (see section 19, commands 16-18)

# 9. Resilience: kill a dependency and show graceful degradation
docker stop shiptrack-country-service
for i in 1 2 3; do
  curl -s -o /dev/null -w "attempt $i: %{http_code} (%{time_total}s)\n" \
    -X POST http://localhost:18080/api/quotes -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" -d '{"originCountryCode":"US","destinationCountryCode":"GB","weightKg":1}'
done
# attempt 1 is slow (retry/timeout playing out; may even show a 503 from the Gateway's own
# breaker); attempts 2+ are near-instant 201s using Quote Service's fallback pricing
docker start shiptrack-country-service

# 10. Tear down
docker compose down             # add -v to also wipe the Postgres/Mongo volumes
```
