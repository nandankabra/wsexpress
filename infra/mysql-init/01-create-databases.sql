-- Split ShipTrack's MySQL-backed services into separate databases and grant the app
-- user access to both (the official image only auto-grants MYSQL_DATABASE).
CREATE DATABASE IF NOT EXISTS location_db;
CREATE DATABASE IF NOT EXISTS pricing_db;
GRANT ALL PRIVILEGES ON location_db.* TO 'shiptrack'@'%';
GRANT ALL PRIVILEGES ON pricing_db.* TO 'shiptrack'@'%';
FLUSH PRIVILEGES;
