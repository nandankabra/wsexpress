-- Database-per-service: Auth, Shipment and Quote each own their schema, connected to by that
-- service alone (JPA/Flyway/Hibernate ddl-auto owns table creation from here).
CREATE DATABASE auth_db;
CREATE DATABASE shipment_db;
CREATE DATABASE quote_db;
