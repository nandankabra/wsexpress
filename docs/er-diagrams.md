# ShipTrack Data Model

## PostgreSQL (auth-service, user-service, carrier-service, shipment-service)

Each service owns its own database (`auth_db`, `user_db`, `carrier_db`, `shipment_db`) on the
same Postgres instance - no cross-service foreign keys, only shared `user_id` values that are
UUIDs minted by `auth-service`.

```mermaid
erDiagram
    USERS ||--o| CUSTOMER_PROFILES : "user_id (auth_db -> user_db)"
    USERS ||--o| CARRIERS : "user_id (auth_db -> carrier_db)"
    USERS ||--o{ REFRESH_TOKENS : has

    USERS {
        uuid id PK
        varchar name
        varchar email UK
        varchar password_hash
        varchar role "CUSTOMER | CARRIER | ADMIN"
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    REFRESH_TOKENS {
        uuid id PK
        uuid user_id FK
        varchar token_hash UK
        boolean revoked
        timestamptz expires_at
        timestamptz created_at
    }

    CUSTOMER_PROFILES {
        uuid user_id PK
        varchar full_name
        varchar email
        varchar phone
        varchar address_line1
        varchar address_line2
        varchar city
        varchar state
        varchar postal_code
        varchar country
        timestamptz created_at
        timestamptz updated_at
    }

    CARRIERS {
        uuid user_id PK
        varchar company_name
        varchar contact_email
        varchar contact_phone
        varchar vehicle_type
        varchar license_number
        text service_areas
        boolean is_verified
        timestamptz created_at
        timestamptz updated_at
    }

    SHIPMENTS {
        uuid id PK
        varchar tracking_id UK
        uuid customer_id "-> auth_db.users.id"
        uuid carrier_id "-> auth_db.users.id, nullable"
        varchar origin_address
        varchar origin_city
        varchar origin_country
        varchar destination_address
        varchar destination_city
        varchar destination_country
        numeric weight_kg
        varchar package_type
        varchar status "CREATED..DELIVERED|CANCELLED"
        numeric quoted_price
        varchar currency
        date estimated_delivery_date
        date actual_delivery_date
        varchar delivery_notes
        int version "optimistic concurrency"
        timestamptz created_at
        timestamptz updated_at
    }
```

## MySQL (location-service, pricing-service)

```mermaid
erDiagram
    COUNTRIES ||--o{ CITIES : has
    COUNTRIES ||--o{ WAREHOUSES : has
    COUNTRIES ||--o{ DELIVERY_ROUTES : "origin/destination"

    COUNTRIES {
        varchar_2 code PK
        varchar name
        varchar capital
        varchar_3 currency
    }

    CITIES {
        int id PK
        varchar name
        varchar_2 country_code FK
    }

    WAREHOUSES {
        int id PK
        varchar name
        varchar city
        varchar_2 country_code FK
        varchar address
    }

    DELIVERY_ROUTES {
        int id PK
        varchar_2 origin_country FK
        varchar_2 destination_country FK
        int transit_days
    }

    PRICING_RULES {
        varchar_20 package_type PK
        decimal base_rate
        decimal per_kg_rate
        decimal international_multiplier
        timestamp updated_at
    }

    CURRENCY_RATES {
        varchar_3 currency PK
        decimal rate_to_usd
    }
```

(`pricing_db` and `location_db` are separate MySQL databases on the same server -
`PRICING_RULES`/`CURRENCY_RATES` live in `pricing_db`; the rest live in `location_db`.
`pricing-service` reaches `location-service` over SOAP/REST rather than a DB join.)

## MongoDB Collections (tracking-service, crm-service, audit-service)

```mermaid
erDiagram
    TRACKING_EVENTS {
        ObjectId _id PK
        string trackingId
        string status
        string location
        string note
        string recordedBy
        date timestamp
    }

    ANALYTICS_EVENTS {
        ObjectId _id PK
        string eventType "CUSTOMER_REGISTERED..SHIPMENT_CANCELLED"
        string entityId
        string customerId
        string carrierId
        object metadata
        date timestamp
    }

    AUDIT_LOGS {
        ObjectId _id PK
        string action
        string actorId
        string actorRole
        string service
        string method
        string path
        int statusCode
        string ipAddress
        string correlationId
        string severity "INFO | WARN | SECURITY"
        object metadata
        date timestamp
    }
```

Each collection lives in its own database (`tracking_db`, `crm_db`, `audit_db`) on the same
MongoDB instance. All three are append-mostly event logs - `crm-service`'s aggregation
pipelines compute analytics on read rather than maintaining separate rollup documents.
