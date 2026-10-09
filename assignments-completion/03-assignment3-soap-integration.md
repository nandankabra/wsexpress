# Assignment 3 — External SOAP Partner (mapped to ShipTrack, live not paper)
TeamID: TODO | Name/Roll: TODO

CampusEats asked for `integration.pdf, partner.wsdl, soap-request/response/fault.xml` (design-time only). ShipTrack implements the same edge **live**.

## 1. Context — why SOAP here while rest is REST
Edge: **pricing-service → location-service `CountryInfo`** (logistics reference-data edge). 3-sentence justification: strong WSDL contract both sides can codegen; message-level `GetCountryInfo` lookup must stay stable while REST CRUD evolves; fits currency/country reference data shared like an external partner. Rest stays REST for CRUD speed. See `docs/architecture.md:71-72`.

## 2. Partner WSDL (all six elements)
Live files (not standalone `partner.wsdl`):
- `services/location-service/src/soap/countryWsdl.js:1-59` — `types` (`GetCountryInfoRequest/Response`), `message` In/Out, `portType CountryInfoPortType`, `binding` SOAP document/literal over `http://schemas.xmlsoap.org/soap/http`, `service CountryInfoService` → `http://localhost:8007/wsdl/country`.
- `services/pricing-service/src/soap/currencyWsdl.js` — same shape for currency conversion.
- Served by `node-soap` (`src/soap/index.js` per service).
- Prove: `curl -s http://localhost:8007/wsdl/country?wsdl | head -60` → 200 XML; currency at `http://localhost:8006/wsdl/currency?wsdl`.

## 3. SOAP envelopes (request / response / fault)
No standalone `soap-*.xml` — live equivalents:
- Call: `client.GetCountryInfoAsync({ countryCode })` in `services/pricing-service/src/soap/countryClient.js:37-42`.
- Request = Header (credentials) + Body (`GetCountryInfo`); success = `{code, name, capital, currency}`; fault (unknown/unavailable) → `null` / SOAP Fault.
- Tests: `pricing-service/tests/currencySoap.test.js`, `countryClient.test.js`, `location-service/tests/countrySoap.test.js`.
- Run: `npm test --workspace services/pricing-service` (DB mocked, no Docker needed).

## 4. HTTP binding
`POST /wsdl/country`, Host `localhost:8007`, `Content-Type: text/xml; charset=utf-8`, `SOAPAction: "http://shiptrack.local/countryinfo/GetCountryInfo"` (`countryWsdl.js:48`), endpoint from `soap:address` (`countryWsdl.js:56`). Caller overrides baked localhost via `setEndpoint(${LOCATION_SERVICE_URL}/wsdl/country)` (`countryClient.js:12-22`).
```bash
curl -i -X POST http://localhost:8007/wsdl/country \
  -H 'Content-Type: text/xml' \
  -H 'SOAPAction: "http://shiptrack.local/countryinfo/GetCountryInfo"' \
  --data-binary @soap-request.xml
```

## 5. Discovery (modern form, no UDDI server)
Via env + WSDL URL: `LOCATION_SERVICE_URL` (`pricing-service/.env.example`, `countryClient.js:12`) + fetch `${LOCATION_SERVICE_URL}/wsdl/country?wsdl`. Lazy `soap.createClientAsync(wsdlUrl)` with cache-clear on fail (`countryClient.js:10-30`).
Registry row: business=`ShipTrack-Location`, service=`CountryInfoService`, endpoint=`http://location-service:8007/wsdl/country`, tModel=`http://shiptrack.local/countryinfo + ?wsdl`.

## 6. Fault mapping (partner vocab must not leak)
`countryClient.js:40` returns `null` on unknown/SOAP-fail → `pricingService.js` degrades to default transit/currency; `shipment-service/src/clients/trackingClient.js:9` `fallback: () => null` so status update still succeeds. Surfaced only as REST `ApiError` (`common/src/errors.js`): `404 NOT_FOUND`, `422 UNPROCESSABLE_ENTITY`, `503 SERVICE_UNAVAILABLE` — never raw SOAP fault to students.
