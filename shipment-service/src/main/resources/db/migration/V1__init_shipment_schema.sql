CREATE TABLE shipments (
    id                        BIGSERIAL PRIMARY KEY,
    tracking_number           VARCHAR(40)  NOT NULL UNIQUE,
    sender_name               VARCHAR(255) NOT NULL,
    sender_address            VARCHAR(500) NOT NULL,
    receiver_name             VARCHAR(255) NOT NULL,
    receiver_address          VARCHAR(500) NOT NULL,
    origin_country_code       VARCHAR(2)   NOT NULL,
    destination_country_code  VARCHAR(2)   NOT NULL,
    weight_kg                 DOUBLE PRECISION NOT NULL,
    status                    VARCHAR(20)  NOT NULL DEFAULT 'CREATED',
    created_by_user_id        BIGINT,
    created_at                TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ  NOT NULL DEFAULT now(),
    version                   BIGINT       NOT NULL DEFAULT 0
);

CREATE TABLE idempotency_keys (
    idempotency_key VARCHAR(128) PRIMARY KEY,
    request_hash    VARCHAR(64)  NOT NULL,
    response_status INTEGER      NOT NULL,
    response_body   TEXT         NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
    id                    BIGSERIAL PRIMARY KEY,
    action                VARCHAR(20)  NOT NULL,
    entity_type           VARCHAR(50)  NOT NULL,
    entity_id             BIGINT       NOT NULL,
    performed_by_user_id  BIGINT,
    "timestamp"           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    details               TEXT
);

CREATE INDEX idx_shipments_destination ON shipments (destination_country_code);
CREATE INDEX idx_shipments_status ON shipments (status);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
