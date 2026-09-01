# ShipTrack Architecture

## High-Level Architecture

```mermaid
flowchart TB
    subgraph Clients
        Browser["React SPA<br/>(Customer / Carrier / Admin portals)"]
        Postman["Postman / curl / external clients"]
    end

    Browser -->|HTTPS| Gateway["API Gateway :8000<br/>routing, JWT validation, rate limiting,<br/>correlation IDs, structured logging"]
    Postman --> Gateway

    Gateway --> Auth["Auth Service :8001"]
    Gateway --> User["User Service :8002"]
    Gateway --> Carrier["Carrier Service :8003"]
    Gateway --> Shipment["Shipment Service :8004"]
    Gateway --> Tracking["Tracking Service :8005"]
    Gateway --> Pricing["Pricing Service :8006"]
    Gateway --> Location["Location Service :8007"]
    Gateway --> CRM["CRM Service :8008"]
    Gateway --> Audit["Audit Service :8009"]
    Gateway --> Notification["Notification Service :8010"]
    Gateway --> GraphQL["GraphQL Service :8011"]

    Shipment -->|REST, resilient httpClient| Pricing
    Shipment -->|REST, resilient httpClient| Tracking
    Pricing -->|SOAP client reads WSDL| Location
    Pricing -->|REST| Location
    GraphQL -->|REST| Shipment
    GraphQL -->|REST| Tracking
    GraphQL -->|REST| User

    Auth --> Postgres[("PostgreSQL")]
    User --> Postgres
    Carrier --> Postgres
    Shipment --> Postgres

    Location --> MySQL[("MySQL")]
    Pricing --> MySQL

    Tracking --> Mongo[("MongoDB")]
    CRM --> Mongo
    Audit --> Mongo

    Notification -.->|SMTP or JSON log transport| Mail[("Mail")]
```

## Microservices Map

| Service | Port | Database | Responsibilities |
|---|---|---|---|
| api-gateway | 8000 | - | Routing, gateway-level JWT validation, rate limiting, correlation IDs, structured logging |
| auth-service | 8001 | PostgreSQL (`auth_db`) | Register (customer), login, refresh/logout, admin-provisioned carrier/admin accounts |
| user-service | 8002 | PostgreSQL (`user_db`) | Customer profile CRUD |
| carrier-service | 8003 | PostgreSQL (`carrier_db`) | Carrier profile CRUD, admin verification |
| shipment-service | 8004 | PostgreSQL (`shipment_db`) | Create/update shipments, delivery info, public tracking lookup, shipment history |
| tracking-service | 8005 | MongoDB (`tracking_db`) | Tracking events, status history |
| pricing-service | 8006 | MySQL (`pricing_db`) | Shipping cost calculation, pricing rules, SOAP currency conversion |
| location-service | 8007 | MySQL (`location_db`) | Countries, cities, warehouses, delivery routes, SOAP country info |
| crm-service | 8008 | MongoDB (`crm_db`) | Customer/shipment/carrier analytics (event-sourced aggregation) |
| audit-service | 8009 | MongoDB (`audit_db`) | Audit logs, security events, API request logs |
| notification-service | 8010 | - | Email notifications (SMTP or JSON/log transport) |
| graphql-service | 8011 | - | Aggregated shipment/tracking/customer-dashboard queries |

## Communication Patterns

- **REST** is the primary inter-service and client-facing protocol; every service exposes `/api/v1/...` routes and its own hand-written `openapi.yaml` served at `/api-docs`.
- **GraphQL** (`graphql-service`) aggregates REST calls to shipment/tracking/user services behind a single query surface for dashboard-style reads.
- **SOAP**: `location-service` exposes a WSDL-described `CountryInfoService`; `pricing-service` reads that WSDL and performs real SOAP requests against it while calculating quotes, and also exposes its own SOAP `CurrencyConversionService`.
- **Resilience**: every outbound REST call between services goes through `@shiptrack/common`'s `createServiceClient` - timeout, exponential-backoff retry, and an Opossum circuit breaker with a per-call fallback (e.g. shipment→tracking degrades to a no-op if tracking-service is down; pricing→location's REST route lookup falls back to a default transit estimate).

## Request Lifecycle (example: create shipment)

```mermaid
sequenceDiagram
    participant C as Customer (browser)
    participant GW as API Gateway
    participant S as Shipment Service
    participant P as Pricing Service
    participant L as Location Service (SOAP)
    participant T as Tracking Service

    C->>GW: POST /api/v1/shipments (JWT, Idempotency-Key)
    GW->>GW: validate JWT, rate limit, correlation ID
    GW->>S: proxy request
    S->>P: POST /api/v1/pricing/quote
    P->>L: SOAP GetCountryInfo(destinationCountry)
    L-->>P: country + currency
    P->>L: GET /api/v1/locations/routes/lookup (REST)
    L-->>P: transit days
    P-->>S: { priceAmount, currency, estimatedDays }
    S->>S: persist shipment (Postgres)
    S->>T: POST /api/v1/tracking/:trackingId/events (best-effort)
    T-->>S: event recorded
    S-->>GW: 201 Created
    GW-->>C: 201 Created
```
