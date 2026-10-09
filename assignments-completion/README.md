# Assignments Completion — serial-wise index
TeamID: TODO | Name/Roll: TODO | Date: 2026-09-08

One folder proving all 4 assignment patterns are completed for **ShipTrack (shipment1212)**. CampusEats names mapped to ShipTrack equivalents.

| # | Assignment | File in this folder | Status for this project |
|---|---|---|---|
| 1 | HTTP by Hand & Project Setup | `01-assignment1-http-and-setup.md` | COMPLETED (mapped): 5x `curl -i` table + DevTools steps + repo proof + brief nouns/verbs |
| 2 | Services, Contracts & Schema | `02-assignment2-design-contracts-schema.md` | COMPLETED (mapped): capabilities, 12-service diagram + ownership, `openapi.yaml` contracts, `createShipment` central op, ER + SQL, 5-property check |
| 3 | External SOAP Partner | `03-assignment3-soap-integration.md` | COMPLETED (live, stronger than paper): WSDLs served, SOAP client, binding, discovery, fault map |
| 4 | Rebuilding service in REST (tracking-service) | `04-assignment4-tracking-rest.md` | COMPLETED (mapped): Parts A–D, resource table, `openapi.yaml`, implementation, tests, resilience, 5 answers |

## How to verify (copy-paste)
```bash
cd "/Users/nandankabra/Desktop/IIIT /sem 3 /webservices/shipment1212"
ls assignments-completion/
cp .env.example .env; docker compose up -d --build; docker compose ps
open http://localhost:18000/api-docs
open http://localhost:8005/api-docs
curl -s http://localhost:8007/wsdl/country?wsdl | head -20
npm install; npm test --workspace services/tracking-service
npx @redocly/cli lint services/tracking-service/openapi.yaml
```

Note: original PDFs say CampusEats; this folder shows the same 4 patterns done for ShipTrack. For literal CampusEats filenames (`http-log.md`, `design.pdf`, `partner.wsdl`, `NOTES.md`), generate them from these 4 files + fill TeamID/Name-Roll.
