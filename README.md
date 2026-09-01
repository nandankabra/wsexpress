# ShipTrack Microservices Platform

A logistics and shipment-tracking platform built as 10 independent Spring Boot microservices,
demonstrating JWT security, ETag/idempotency/optimistic-locking HTTP semantics, SOAP (contract-first),
GraphQL, Kafka-driven async processing, Resilience4j fault tolerance, and centralized
config/discovery — all behind a single API Gateway, containerized with Docker Compose.

Backend only — no frontend. Every endpoint is reachable via `curl`, Swagger UI, or GraphiQL.

## Documentation

- **[PROFESSOR_DEMONSTRATION_GUIDE.md](PROFESSOR_DEMONSTRATION_GUIDE.md)** — architecture, every
  flow explained, full curl walkthrough, viva Q&A. Start here for a demo.
- **[REQUIREMENT_TRACEABILITY_MATRIX.md](REQUIREMENT_TRACEABILITY_MATRIX.md)** — all 28 requirements
  mapped to service/class/endpoint/verification.
- **[docs/diagrams.md](docs/diagrams.md)** — architecture, sequence, ER, deployment, communication
  and class diagrams (Mermaid).

## Services and ports

| Service | Port | Tech | Datastore |
|---|---|---|---|
| API Gateway | 8080 (host: 18080) | Spring Cloud Gateway | Redis (rate limiting) |
| Eureka Discovery Server | 8761 | Netflix Eureka | — |
| Config Server | 8888 | Spring Cloud Config (native) | — |
| Auth Service | 8081 | Spring Security + JWT | PostgreSQL (`auth_db`) |
| Shipment Service | 8082 | Spring MVC + JPA | PostgreSQL (`shipment_db`) |
| Tracking Service | 8083 | Spring MVC + Spring Data MongoDB | MongoDB (`tracking_db`) |
| Quote Service | 8084 | OpenFeign + Resilience4j | PostgreSQL (`quote_db`) |
| Country Service | 8085 | Spring-WS (SOAP, contract-first) | in-memory |
| GraphQL Service | 8086 | Spring for GraphQL | — (fans out via Feign) |
| Notification Service | 8087 | Spring Kafka consumer | in-memory |

> Host ports 8080 and 5432 may already be taken by other software on your machine; the gateway
> and Postgres are published on 18080/15432 respectively in `docker-compose.yml` — the containers
> themselves still listen on 8080/5432 internally, satisfying the spec's required ports.

## Quick start

```bash
docker compose build
docker compose up -d
docker compose ps               # wait until everything is "healthy"
```

Then:

```bash
# Log in as the seeded admin
curl -X POST http://localhost:18080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shiptrack.dev","password":"Admin@123"}'
```

See the [demonstration guide](PROFESSOR_DEMONSTRATION_GUIDE.md) for the full golden-path walkthrough
(shipments, tracking, quotes, GraphQL, SOAP).

- Eureka dashboard: http://localhost:8761
- Swagger UI per service: `http://localhost:<port>/swagger-ui.html`
- GraphiQL: http://localhost:8086/graphiql (path may vary — see `spring.graphql.graphiql`)
- Country Service WSDL: http://localhost:8085/ws/countries.wsdl

## Building and testing locally (without Docker)

Requires JDK 21 and Maven.

```bash
mvn -N install                  # install the parent POM
mvn -pl common install -DskipTests
mvn clean test-compile          # compile everything + tests
mvn -pl auth-service test       # run a specific module's unit tests
```

Testcontainers-based integration tests (`shipment-service`) require a real Docker daemon reachable
from the JVM running the tests.

## Architecture at a glance

```
Client → API Gateway (JWT verify, rate limit, circuit breaker, correlation IDs)
              │
   ┌──────────┼──────────────┬───────────┬────────────┬─────────────┬────────────────┐
   ▼          ▼               ▼           ▼            ▼             ▼                ▼
 Auth      Shipment       Tracking      Quote       Country       GraphQL       Notification
(JWT/RBAC) (Postgres,     (MongoDB,   (Postgres,   (SOAP/WSDL,   (fans out    (Kafka consumer,
            ETag,          cursor      Feign→        REST         to all       in-memory
            idempotency)   paging)     Country,     wrapper)      others)      history)
                                       Resilience4j)
                     │                                    ▲
                     └─── Kafka: shipment-events ──────────┘
                     └─── Kafka: tracking-events ───────────┘

All services register with Eureka and pull shared config (JWT secret, Eureka URL, actuator
exposure, logging pattern) from the Config Server.
```

## Notes on design choices

- **Config Server** uses the `native` profile (serves YAML from its own classpath, not a git repo)
  — no external git dependency needed to run this project.
- **Notification Service** uses real Kafka (KRaft mode, no Zookeeper), not in-process Spring
  Events — events can't cross a process boundary, so an in-process event bus wouldn't actually
  connect Shipment/Tracking to Notification as separate microservices.
- **Country Service** is a self-hosted SOAP endpoint (not a call to a third-party public SOAP
  demo service), so the demo doesn't depend on external uptime; the WSDL/contract-first mechanics
  are real either way.
- **Downstream services trust the Gateway** for identity (`X-User-Id` / `X-User-Roles` headers
  injected after JWT verification) rather than re-verifying JWTs themselves — a common
  edge-authentication pattern. Auth Service is the exception: it verifies JWTs itself so
  `/api/auth/validate` and `/api/auth/users` work correctly.
