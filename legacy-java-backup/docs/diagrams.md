# ShipTrack — Diagrams

## 1. Architecture / microservice communication

```mermaid
flowchart TB
    Client([Client / curl / Postman])

    subgraph Edge["Edge"]
        GW["API Gateway :8080\nJWT verify, correlation IDs,\nrate limit, circuit breaker"]
    end

    subgraph Platform["Platform services"]
        AUTH["Auth Service :8081\nPostgreSQL auth_db"]
        SHIP["Shipment Service :8082\nPostgreSQL shipment_db"]
        TRACK["Tracking Service :8083\nMongoDB tracking_db"]
        QUOTE["Quote Service :8084\nPostgreSQL quote_db"]
        COUNTRY["Country Service :8085\nSOAP / WSDL"]
        GQL["GraphQL Service :8086"]
        NOTIF["Notification Service :8087"]
    end

    subgraph Infra["Infrastructure"]
        EUREKA["Eureka :8761"]
        CONFIG["Config Server :8888"]
        REDIS[("Redis")]
        KAFKA[("Kafka")]
    end

    Client --> GW
    GW --> AUTH
    GW --> SHIP
    GW --> TRACK
    GW --> QUOTE
    GW --> COUNTRY
    GW --> GQL
    GW --> NOTIF
    GW -. rate limit state .-> REDIS

    GQL --> SHIP
    GQL --> TRACK
    GQL --> QUOTE
    GQL --> COUNTRY
    QUOTE --> COUNTRY

    SHIP -- shipment-events --> KAFKA
    TRACK -- tracking-events --> KAFKA
    KAFKA --> NOTIF

    AUTH -. register/discover .-> EUREKA
    SHIP -. register/discover .-> EUREKA
    TRACK -. register/discover .-> EUREKA
    QUOTE -. register/discover .-> EUREKA
    COUNTRY -. register/discover .-> EUREKA
    GQL -. register/discover .-> EUREKA
    NOTIF -. register/discover .-> EUREKA
    GW -. register/discover .-> EUREKA

    AUTH -. pull config .-> CONFIG
    SHIP -. pull config .-> CONFIG
    TRACK -. pull config .-> CONFIG
    QUOTE -. pull config .-> CONFIG
    COUNTRY -. pull config .-> CONFIG
    GQL -. pull config .-> CONFIG
    NOTIF -. pull config .-> CONFIG
    GW -. pull config .-> CONFIG
```

## 2. Sequence — JWT login and a gateway-protected call

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant A as Auth Service
    participant S as Shipment Service

    C->>GW: POST /api/auth/login {email, password}
    GW->>A: forward (public path, no JWT check)
    A->>A: verify password (BCrypt), load roles
    A-->>GW: 200 {token, roles}
    GW-->>C: 200 {token, roles}

    C->>GW: GET /api/shipments  Authorization: Bearer <token>
    GW->>GW: JwtAuthenticationGlobalFilter: verify signature + expiry
    alt token invalid/expired
        GW-->>C: 401 problem+json
    else token valid
        GW->>GW: inject X-User-Id / X-User-Roles headers
        GW->>S: GET /api/shipments (trusted headers)
        S-->>GW: 200 Page<Shipment>
        GW-->>C: 200 Page<Shipment>
    end
```

## 3. Sequence — ETag / idempotency / optimistic locking

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant S as Shipment Service
    participant DB as PostgreSQL

    C->>GW: POST /api/shipments  Idempotency-Key: k1
    GW->>S: forward
    S->>DB: check idempotency_keys for k1 (miss)
    S->>DB: INSERT shipment (version=0)
    S->>DB: INSERT idempotency_keys(k1, hash, response)
    S-->>GW: 201 Created  ETag: "1-0"  Location: /api/shipments/1
    GW-->>C: 201

    C->>GW: POST /api/shipments  Idempotency-Key: k1 (retry, same body)
    GW->>S: forward
    S->>DB: check idempotency_keys for k1 (hit, hash matches)
    S-->>GW: 200 OK (replayed original body)
    GW-->>C: 200

    C->>GW: GET /api/shipments/1  If-None-Match: "1-0"
    GW->>S: forward
    S->>DB: SELECT shipment 1 (version=0)
    S-->>GW: 304 Not Modified
    GW-->>C: 304

    C->>GW: PATCH /api/shipments/1  If-Match: "1-0"  {status: IN_TRANSIT}
    GW->>S: forward
    S->>DB: SELECT shipment 1, compare version (0 == 0, OK)
    S->>DB: UPDATE shipment SET status=..., version=1
    S-->>GW: 200 OK  ETag: "1-1"
    GW-->>C: 200

    C->>GW: PATCH /api/shipments/1  If-Match: "1-0" (stale, already at v1)
    GW->>S: forward
    S->>DB: SELECT shipment 1, compare version (0 != 1)
    S-->>GW: 412 Precondition Failed
    GW-->>C: 412
```

## 4. Sequence — Quote request (SOAP + Resilience4j)

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant Q as Quote Service
    participant CL as CountryLookupService
    participant CS as Country Service (REST wrapper)
    participant SC as SoapCountryClient
    participant WS as Country SOAP Endpoint

    C->>GW: POST /api/quotes {origin, destination, weightKg}
    GW->>Q: forward
    Q->>CL: lookup(origin) [@Retry, @CircuitBreaker]
    CL->>CS: GET /api/countries/{code}  (Feign, 2s connect / 3s read timeout)
    CS->>SC: getCountry(code)
    SC->>WS: SOAP getCountryRequest (marshalled XML over HTTP)
    WS-->>SC: SOAP getCountryResponse (or SOAP Fault if unknown)
    SC-->>CS: GetCountryResponse (unmarshalled)
    CS-->>CL: 200 CountryInfoDto
    CL-->>Q: CountryInfoDto
    Q->>Q: compute amount (base + per-kg + international surcharge)
    Q-->>GW: 201 Created {amount, currency}
    GW-->>C: 201

    Note over CL,CS: If Country Service is down/slow: Retry (3x) then\nCircuitBreaker opens, fallback pricing metadata used instead of failing the quote.
```

## 5. Sequence — Async notification via Kafka

```mermaid
sequenceDiagram
    participant S as Shipment Service
    participant K as Kafka (shipment-events)
    participant N as Notification Service
    participant Store as In-memory history

    S->>S: create/patch shipment
    S->>K: publish {eventType, shipmentId, trackingNumber, status}
    Note over S,K: Producer does not block on delivery (async, whenComplete logs failures)
    K-->>N: @KafkaListener consumes event
    N->>N: format human-readable message
    N->>Store: record Notification (channel, type, message)
    N->>N: log "[NOTIFY:EMAIL] shipment.created -- ..."
```

## 6. Entity-Relationship diagram (PostgreSQL)

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : grants
    USERS {
        bigint id PK
        varchar email UK
        varchar password
        varchar full_name
        boolean enabled
        timestamptz created_at
    }
    ROLES {
        bigint id PK
        varchar name UK
    }
    USER_ROLES {
        bigint user_id FK
        bigint role_id FK
    }

    SHIPMENTS {
        bigint id PK
        varchar tracking_number UK
        varchar sender_name
        varchar receiver_name
        varchar origin_country_code
        varchar destination_country_code
        double weight_kg
        varchar status
        bigint created_by_user_id
        bigint version
    }
    IDEMPOTENCY_KEYS {
        varchar idempotency_key PK
        varchar request_hash
        integer response_status
        text response_body
    }
    AUDIT_LOGS {
        bigint id PK
        varchar action
        varchar entity_type
        bigint entity_id
        bigint performed_by_user_id
        text details
    }

    QUOTES {
        bigint id PK
        varchar origin_country_code
        varchar destination_country_code
        double weight_kg
        varchar carrier_name
        numeric amount
        varchar currency
    }
```

> `auth_db`, `shipment_db` and `quote_db` are three separate PostgreSQL databases in one
> container (database-per-service) — there are no cross-database foreign keys; `SHIPMENTS` and
> `QUOTES` reference `USERS.id` only logically, via the JWT-derived `X-User-Id` header.

## 7. MongoDB collections (Tracking Service)

```mermaid
erDiagram
    TRACKING_EVENTS {
        ObjectId _id PK
        long shipmentId
        string trackingNumber
        string eventType
        string location
        string source
        date occurredAt
    }
    CARRIER_PAYLOADS {
        ObjectId _id PK
        string carrierId
        string rawPayload
        string resultingTrackingEventId
        date receivedAt
    }
    REQUEST_AUDIT {
        ObjectId _id PK
        string correlationId
        string method
        string path
        int statusCode
        long durationMs
    }
```

## 8. Deployment diagram (Docker Compose)

```mermaid
flowchart TB
    subgraph Host["Host machine"]
        subgraph Net["shiptrack-platform-net (Docker bridge network)"]
            GW["api-gateway\n:8080→18080"]
            EU["discovery-server\n:8761"]
            CFG["config-server\n:8888"]
            A["auth-service\n:8081"]
            SH["shipment-service\n:8082"]
            TR["tracking-service\n:8083"]
            Q["quote-service\n:8084"]
            CO["country-service\n:8085"]
            GQ["graphql-service\n:8086"]
            N["notification-service\n:8087"]
            PG[("postgres\n:5432→15432")]
            MG[("mongo\n:27017")]
            RD[("redis\n:6379")]
            KF[("kafka (KRaft)\n:9092/:29092")]
        end
    end
    Browser([Browser / curl on host]) -->|localhost:18080| GW
    Browser -->|localhost:8761| EU
```

## 9. Class diagram — Shipment Service core

```mermaid
classDiagram
    class Shipment {
        Long id
        String trackingNumber
        String status
        Long version
        etag() String
    }
    class ShipmentController {
        +create(ShipmentRequest) ResponseEntity
        +getById(Long, ifNoneMatch) ResponseEntity
        +patch(Long, ShipmentPatchRequest, ifMatch) ResponseEntity
        +delete(Long, ifMatch) ResponseEntity
        +search(...) ResponseEntity
    }
    class ShipmentService {
        <<interface>>
        +create(...) CreateResult
        +findById(Long) Shipment
        +patch(...) Shipment
        +delete(...) void
    }
    class ShipmentServiceImpl {
        -ShipmentRepository shipmentRepository
        -IdempotencyKeyRepository idempotencyKeyRepository
        -ShipmentEventPublisher eventPublisher
    }
    class ShipmentRepository {
        <<interface>>
    }
    class IdempotencyKey {
        String key
        String requestHash
        String responseBody
    }
    class ShipmentEventPublisher {
        +publish(ShipmentEvent) void
    }

    ShipmentController --> ShipmentService
    ShipmentService <|.. ShipmentServiceImpl
    ShipmentServiceImpl --> ShipmentRepository
    ShipmentServiceImpl --> IdempotencyKey
    ShipmentServiceImpl --> ShipmentEventPublisher
    ShipmentServiceImpl --> Shipment
```
