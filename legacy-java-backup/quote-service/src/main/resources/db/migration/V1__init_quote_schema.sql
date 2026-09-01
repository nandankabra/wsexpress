CREATE TABLE quotes (
    id                        BIGSERIAL PRIMARY KEY,
    origin_country_code       VARCHAR(2)   NOT NULL,
    destination_country_code  VARCHAR(2)   NOT NULL,
    weight_kg                 DOUBLE PRECISION NOT NULL,
    carrier_name               VARCHAR(50)  NOT NULL,
    amount                     NUMERIC(12,2) NOT NULL,
    currency                   VARCHAR(3)   NOT NULL,
    requested_by_user_id       BIGINT,
    created_at                 TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotes_route ON quotes (origin_country_code, destination_country_code);
