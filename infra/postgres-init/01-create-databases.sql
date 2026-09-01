-- The Postgres image only creates one database (POSTGRES_DB) automatically. ShipTrack
-- splits its Postgres-backed services into separate databases, so create the rest here.
-- Runs once, only when the data directory is first initialized.
CREATE DATABASE auth_db;
CREATE DATABASE user_db;
CREATE DATABASE carrier_db;
CREATE DATABASE shipment_db;
