const axios = require('axios');

const BASE_URL = process.env.API_GATEWAY_URL || 'http://localhost:18000';
const api = axios.create({ baseURL: BASE_URL, timeout: 25000 });

const results = [];
const statusCodesObserved = new Set();

function record(name, pass, detail, code) {
  if (code) statusCodesObserved.add(code);
  results.push({ name, pass, detail, code });
  const icon = pass ? '✅ PASS' : '❌ FAIL';
  console.log(`[${icon}] ${name}: ${detail}`);
  if (!pass) throw new Error(`${name} failed: ${detail}`);
}

async function run() {
  console.log('================================================================');
  console.log('🚀 ShipTrack Master End-to-End & Requirements Verification Suite');
  console.log(`   Target Gateway: ${BASE_URL}`);
  console.log('================================================================\n');

  const ts = Date.now();

  // -------------------------------------------------------------
  // 1. AUTHENTICATION: Registration & Email Verification
  // -------------------------------------------------------------
  console.log('>>> 1. AUTHENTICATION & IDENTITY <<<');
  const custEmail = `cust_${ts}@example.com`;
  const custPassword = 'CustomerPassword123!';
  const regRes = await api.post('/api/v1/auth/register', {
    name: 'Master Customer',
    email: custEmail,
    password: custPassword,
  });
  record('Customer Registration', regRes.status === 201, `Status: ${regRes.status}`, regRes.status);

  // Email verification with OTP
  const verifyRes = await api.post('/api/v1/auth/verify-email', {
    email: custEmail,
    otp: '000000',
  });
  record('Email Verification (Magic OTP)', verifyRes.status === 200, `Verified customer account`, verifyRes.status);

  // Login
  const loginRes = await api.post('/api/v1/auth/login', {
    email: custEmail,
    password: custPassword,
  });
  record('Customer Login', loginRes.status === 200 && !!loginRes.data.accessToken, `JWT Access Token obtained`, loginRes.status);
  const customerToken = loginRes.data.accessToken;
  const customerRefreshToken = loginRes.data.refreshToken;
  const customerId = loginRes.data.user.id;

  // Refresh Token
  const refreshRes = await api.post('/api/v1/auth/refresh', {
    refreshToken: customerRefreshToken,
  });
  record('Token Refresh', refreshRes.status === 200 && !!refreshRes.data.accessToken, `New access token issued`, refreshRes.status);

  // Current User /me
  const meRes = await api.get('/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  record('Auth Profile /auth/me', meRes.status === 200 && meRes.data.email === custEmail, `User email matches`, meRes.status);

  // Admin Login
  const adminCreds = [
    { email: process.env.ADMIN_EMAIL || 'admin@shiptrack.local', password: process.env.ADMIN_PASSWORD || 'Admin@12345' },
    { email: 'admin@shiptrack.com', password: 'Admin@ShipTrack2026!' },
  ];
  let adminRes;
  for (const c of adminCreds) {
    try {
      adminRes = await api.post('/api/v1/auth/login', c);
      if (adminRes.status === 200) break;
    } catch (e) {}
  }
  record('Admin Login', !!adminRes && adminRes.status === 200, `Admin authenticated`, adminRes.status);
  const adminToken = adminRes.data.accessToken;

  // Logout test (create disposable user to logout)
  const logoutUserEmail = `logout_${ts}@example.com`;
  await api.post('/api/v1/auth/register', { name: 'Logout User', email: logoutUserEmail, password: custPassword });
  await api.post('/api/v1/auth/verify-email', { email: logoutUserEmail, otp: '000000' });
  const logoutLoginRes = await api.post('/api/v1/auth/login', { email: logoutUserEmail, password: custPassword });
  const logoutRes = await api.post('/api/v1/auth/logout', { refreshToken: logoutLoginRes.data.refreshToken });
  record('User Logout (204 No Content)', logoutRes.status === 204, `Session/token invalidated with HTTP 204`, logoutRes.status);

  // -------------------------------------------------------------
  // 2. CARRIER PROVISIONING & CARRIER UPDATION
  // -------------------------------------------------------------
  console.log('\n>>> 2. CARRIER PROVISIONING & CARRIER UPDATION <<<');
  const carrierEmail = `carrier_${ts}@example.com`;
  const carrierPassword = 'CarrierPassword123!';

  // Admin provisions a Carrier Account
  const createCarrierRes = await api.post(
    '/api/v1/auth/admin/accounts',
    {
      name: `Speedy Express ${ts}`,
      email: carrierEmail,
      password: carrierPassword,
      role: 'CARRIER',
    },
    { headers: { Authorization: `Bearer ${adminToken}`, 'Idempotency-Key': `idemp-carrier-${ts}` } }
  );
  record('Admin Provisions Carrier', createCarrierRes.status === 201, `Carrier account created: ${carrierEmail}`, createCarrierRes.status);

  // Carrier Logs In
  const carrierLoginRes = await api.post('/api/v1/auth/login', {
    email: carrierEmail,
    password: carrierPassword,
  });
  record('Carrier Login', carrierLoginRes.status === 200 && carrierLoginRes.data.user.role === 'CARRIER', `Carrier authenticated`, carrierLoginRes.status);
  const carrierToken = carrierLoginRes.data.accessToken;
  const carrierId = carrierLoginRes.data.user.id;

  // Carrier Profile Updation (carrier make a carrier updation)
  const carrierUpdateRes = await api.put(
    '/api/v1/carriers/me',
    {
      companyName: 'Speedy Express Global Logistics',
      contactEmail: carrierEmail,
      contactPhone: '+1-555-0199',
      serviceAreas: 'New Delhi, Mumbai, Bangalore',
      vehicleType: 'VAN',
      licenseNumber: 'LIC-998877',
    },
    { headers: { Authorization: `Bearer ${carrierToken}` } }
  );
  record('Carrier Profile Updation (PUT /me)', carrierUpdateRes.status === 200, `Company: ${carrierUpdateRes.data.companyName}`, carrierUpdateRes.status);

  // Carrier Inspects Profile (GET /me)
  const carrierMeRes = await api.get('/api/v1/carriers/me', {
    headers: { Authorization: `Bearer ${carrierToken}` },
  });
  record('Carrier Fetch Profile (GET /me)', carrierMeRes.status === 200 && carrierMeRes.data.contactPhone === '+1-555-0199', `Profile verified`, carrierMeRes.status);

  // Admin Verifies Carrier (PATCH /:userId/verify)
  const verifyCarrierRes = await api.patch(
    `/api/v1/carriers/${carrierId}/verify`,
    { isVerified: true },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  record('Admin Verifies Carrier (PATCH /:id/verify)', verifyCarrierRes.status === 200 && verifyCarrierRes.data.isVerified === true, `isVerified: true`, verifyCarrierRes.status);

  // -------------------------------------------------------------
  // 3. PRICING & SHIPMENT BOOKING (REAL SCENARIO)
  // -------------------------------------------------------------
  console.log('\n>>> 3. PRICING ENGINE, DISTANCE & SHIPMENT LIFECYCLE <<<');
  const quotePayload = {
    origin: { address: 'Connaught Place', city: 'New Delhi', country: 'IN' },
    destination: { address: 'Marine Drive', city: 'Mumbai', country: 'IN' },
    packageType: 'PARCEL',
    weightKg: 5.0,
  };

  const quoteRes = await api.post('/api/v1/shipments/quotes', quotePayload, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  record('Dynamic Pricing Quote', quoteRes.status === 200 && quoteRes.data.totalAmount > 0, `Quoted: ${quoteRes.data.currency} ${quoteRes.data.totalAmount}`, quoteRes.status);

  // Currency Conversion
  const fxRes = await api.post('/api/v1/pricing/convert', {
    amount: 100,
    fromCurrency: 'USD',
    toCurrency: 'INR',
  });
  record('SOAP Currency Conversion RPC', fxRes.status === 200 && fxRes.data.convertedAmount > 0, `100 USD = ₹${fxRes.data.convertedAmount} INR`, fxRes.status);

  // Shipment Booking with Idempotency Key
  const idempKey = `idemp-shipment-${ts}`;
  const shipmentPayload = {
    ...quotePayload,
    quotedPrice: quoteRes.data.priceAmount,
    baseFare: quoteRes.data.baseFare,
    distanceCharge: quoteRes.data.distanceCharge,
    weightCharge: quoteRes.data.weightCharge,
    taxAmount: quoteRes.data.taxAmount,
    totalAmount: quoteRes.data.totalAmount,
    currency: quoteRes.data.currency,
  };

  const createShipmentRes = await api.post('/api/v1/shipments', shipmentPayload, {
    headers: { Authorization: `Bearer ${customerToken}`, 'Idempotency-Key': idempKey },
  });
  record('Shipment Booking (POST /shipments)', createShipmentRes.status === 201, `Tracking ID: ${createShipmentRes.data.trackingId}`, createShipmentRes.status);
  const shipment = createShipmentRes.data;

  // Shipping Label PDF Download
  const labelRes = await api.get(`/api/v1/shipments/${shipment.id}/label`, {
    headers: { Authorization: `Bearer ${customerToken}` },
    responseType: 'arraybuffer',
  });
  record('Thermal Shipping Label PDF Generation', labelRes.status === 200 && labelRes.headers['content-type'] === 'application/pdf', `PDF size: ${labelRes.data.length} bytes`, labelRes.status);

  // Commercial Invoice PDF Download
  const invoiceRes = await api.get(`/api/v1/shipments/${shipment.id}/invoice`, {
    headers: { Authorization: `Bearer ${customerToken}` },
    responseType: 'arraybuffer',
  });
  record('Commercial Invoice PDF Generation', invoiceRes.status === 200 && invoiceRes.headers['content-type'] === 'application/pdf', `PDF size: ${invoiceRes.data.length} bytes`, invoiceRes.status);

  // Carrier Claims / Assigns Shipment
  const assignRes = await api.patch(
    `/api/v1/shipments/${shipment.id}/status`,
    { status: 'ASSIGNED', expectedVersion: shipment.version },
    { headers: { Authorization: `Bearer ${carrierToken}` } }
  );
  record('Carrier Claims Shipment (ASSIGNED)', assignRes.status === 200 && assignRes.data.status === 'ASSIGNED', `Status: ASSIGNED, Version: ${assignRes.data.version}`, assignRes.status);
  let curVer = assignRes.data.version;

  // Milestones: PICKED_UP -> ARRIVED_AT_HUB -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED
  const milestones = [
    { status: 'PICKED_UP', lat: 28.6139, lng: 77.2090, note: 'Picked up from Delhi warehouse' },
    { status: 'ARRIVED_AT_HUB', hubId: 'HUB_DEL', lat: 28.5355, lng: 77.3910, note: 'Scanned at Delhi North Hub' },
    { status: 'IN_TRANSIT', lat: 23.0225, lng: 72.5714, note: 'Transit via Ahmedabad Expressway' },
    { status: 'OUT_FOR_DELIVERY', lat: 18.9220, lng: 72.8347, note: 'Out for final delivery in Mumbai' },
    { status: 'DELIVERED', lat: 18.9220, lng: 72.8347, note: 'Delivered and recipient signature obtained' },
  ];

  for (const m of milestones) {
    const res = await api.patch(
      `/api/v1/shipments/${shipment.id}/status`,
      { ...m, expectedVersion: curVer },
      { headers: { Authorization: `Bearer ${carrierToken}` } }
    );
    record(`Milestone: ${m.status}`, res.status === 200 && res.data.status === m.status, `Updated to ${m.status}`, res.status);
    curVer = res.data.version;
  }

  // -------------------------------------------------------------
  // 4. PUBLIC TRACKING & TIMELINE
  // -------------------------------------------------------------
  console.log('\n>>> 4. PUBLIC TRACKING & AUDIT TIMELINE <<<');
  const pubRes = await api.get(`/api/v1/shipments/track/${shipment.trackingId}`);
  record('Public Tracking Lookup (Unauthenticated)', pubRes.status === 200 && pubRes.data.status === 'DELIVERED', `Status: DELIVERED from ${pubRes.data.originCity} to ${pubRes.data.destinationCity}`, pubRes.status);

  // Latest event lookup
  const latestRes = await api.get(`/api/v1/tracking/${shipment.trackingId}/latest`);
  record('Latest Tracking Event (Subresource)', latestRes.status === 200 && latestRes.data.status === 'DELIVERED', `Status: DELIVERED`, latestRes.status);

  // -------------------------------------------------------------
  // 5. REST PROTOCOL PROPERTIES (MODULE 2 REQUIREMENTS)
  // -------------------------------------------------------------
  console.log('\n>>> 5. MODULE 2 REST PROTOCOL CONTRACTS <<<');

  // Idempotency: Replay with same body
  const replayRes = await api.post('/api/v1/shipments', shipmentPayload, {
    headers: { Authorization: `Bearer ${customerToken}`, 'Idempotency-Key': idempKey },
  });
  record('Idempotency Replay (Idempotent-Replay Header)', replayRes.headers['idempotent-replay'] === 'true', `Replay served cached response`, replayRes.status);

  // Idempotency: Conflict with different body (409)
  try {
    await api.post('/api/v1/shipments', { ...shipmentPayload, weightKg: 999.0 }, {
      headers: { Authorization: `Bearer ${customerToken}`, 'Idempotency-Key': idempKey },
    });
    record('Idempotency Conflict (409)', false, 'Did not throw 409');
  } catch (err) {
    const status = err.response?.status;
    const code = err.response?.data?.error?.code;
    record('Idempotency Conflict (409)', status === 409 && code === 'CONFLICT', `HTTP 409 CONFLICT returned`, status);
  }

  // ETag and 304 Not Modified
  const countryRes = await api.get('/api/v1/locations/countries/IN');
  const etagValue = countryRes.headers['etag'];
  const ifNoneMatchRes = await api.get('/api/v1/locations/countries/IN', {
    headers: { 'If-None-Match': etagValue },
    validateStatus: (s) => s === 304,
  });
  record('ETag & 304 Response', ifNoneMatchRes.status === 304, `HTTP 304 with matching ETag: ${etagValue}`, ifNoneMatchRes.status);

  // Deliberate Cache-Control header
  const ccHeader = countryRes.headers['cache-control'];
  record('Deliberate Cache-Control Header', !!ccHeader && ccHeader.includes('max-age'), `Cache-Control: ${ccHeader}`);

  // JSON Schema Validation using ajv (400)
  try {
    await api.post('/api/v1/auth/register', { email: 'bad-email' });
    record('AJV Validation (400)', false, 'Accepted invalid body');
  } catch (err) {
    const status = err.response?.status;
    const details = err.response?.data?.error?.details;
    record('AJV Validation (400)', status === 400 && Array.isArray(details), `HTTP 400 with ${details?.length || 0} validation errors`, status);
  }

  // Content Negotiation: JSON vs XML
  const jsonRes = await api.get('/api/v1/locations/countries', { headers: { Accept: 'application/json' } });
  record('Content Negotiation (JSON)', jsonRes.headers['content-type'].includes('application/json'), `Content-Type: ${jsonRes.headers['content-type']}`);

  const xmlRes = await api.get('/api/v1/locations/countries', { headers: { Accept: 'application/xml' } });
  record('Content Negotiation (XML)', xmlRes.headers['content-type'].includes('application/xml') && xmlRes.data.includes('<response>'), `Content-Type: ${xmlRes.headers['content-type']}`);

  // Cursor Pagination with next link
  const pageRes = await api.get(`/api/v1/tracking/${shipment.trackingId}/events?limit=2`);
  const hasNext = !!pageRes.data?.pagination?.next && !!pageRes.data?.pagination?.nextCursor;
  record('Cursor Pagination with Next Link', hasNext, `Next link: ${pageRes.data?.pagination?.next}`);

  // Consistent Error Body Everywhere & 404 Resource Not Found
  try {
    await api.get('/api/v1/shipments/00000000-0000-0000-0000-000000000000', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    record('Resource Not Found (404)', false, 'Found fake shipment');
  } catch (err) {
    const errObj = err.response?.data?.error;
    const isConsistent = errObj && errObj.code && errObj.message && errObj.service && errObj.correlationId && errObj.timestamp;
    record('Resource Not Found (404)', err.response?.status === 404, `HTTP 404 NOT_FOUND returned`, err.response?.status);
    record('Consistent Error Body Shape', !!isConsistent, `Code: ${errObj?.code}, Service: ${errObj?.service}, CorrelationId: ${errObj?.correlationId}`);
  }

  // State Machine Validation (422 Unprocessable Entity)
  try {
    await api.patch(
      `/api/v1/shipments/${shipment.id}/status`,
      { status: 'PICKED_UP', expectedVersion: curVer }, // Invalid: already DELIVERED!
      { headers: { Authorization: `Bearer ${carrierToken}` } }
    );
    record('State Machine Transition (422)', false, 'Allowed invalid state transition');
  } catch (err) {
    const status = err.response?.status;
    record('State Machine Transition (422)', status === 422, `HTTP 422 UNPROCESSABLE_ENTITY returned`, status);
  }

  // Optimistic Concurrency Control (412 Precondition Failed)
  // Create a quick shipment to test version mismatch
  const occShipmentRes = await api.post('/api/v1/shipments', {
    ...shipmentPayload,
  }, {
    headers: { Authorization: `Bearer ${customerToken}`, 'Idempotency-Key': `idemp-occ-${ts}` }
  });
  try {
    await api.patch(
      `/api/v1/shipments/${occShipmentRes.data.id}/status`,
      { status: 'ASSIGNED', expectedVersion: 999 }, // Wrong expectedVersion: 999 != 1
      { headers: { Authorization: `Bearer ${carrierToken}` } }
    );
    record('OCC Version Conflict (412)', false, 'Accepted stale version');
  } catch (err) {
    const status = err.response?.status;
    record('OCC Version Conflict (412)', status === 412, `HTTP 412 PRECONDITION_FAILED returned`, status);
  }

  // RBAC Authorization Failure (403 Forbidden)
  try {
    await api.get('/api/v1/crm/summary', { headers: { Authorization: `Bearer ${customerToken}` } });
    record('RBAC Authorization (403)', false, 'Customer accessed admin route');
  } catch (err) {
    const status = err.response?.status;
    record('RBAC Authorization (403)', status === 403, `HTTP 403 FORBIDDEN returned for customer`, status);
  }

  // Authentication Required (401 Unauthorized)
  try {
    await api.get('/api/v1/auth/me'); // No auth header
    record('Auth Required (401)', false, 'Allowed unauthenticated call');
  } catch (err) {
    const status = err.response?.status;
    record('Auth Required (401)', status === 401, `HTTP 401 UNAUTHORIZED returned`, status);
  }

  // Rate Limiting Headers
  const rateLimitHeader = jsonRes.headers['ratelimit-limit'] || pubRes.headers['ratelimit-limit'];
  record('Rate Limiting Headers Present', !!rateLimitHeader, `RateLimit-Limit: ${rateLimitHeader}`);

  // -------------------------------------------------------------
  // 6. MODULES 1, 3, 4 ARCHITECTURE & INTEGRATION
  // -------------------------------------------------------------
  console.log('\n>>> 6. MODULES 1, 3, 4 INTEGRATION, GRAPHQL, SOAP & MONITORING <<<');

  // GraphQL Endpoint
  const gqlQuery = {
    query: `
      query Track($id: String!) {
        trackShipment(trackingId: $id) {
          trackingId
          status
          originCity
          destinationCity
        }
      }
    `,
    variables: { id: shipment.trackingId },
  };
  const gqlRes = await api.post('/graphql', gqlQuery);
  record('GraphQL trackShipment Endpoint', gqlRes.status === 200 && gqlRes.data.data.trackShipment.status === 'DELIVERED', `GraphQL status: ${gqlRes.data.data.trackShipment.status}`, gqlRes.status);

  // SOAP WSDL Serving
  const wsdlCountryRes = await axios.get('http://localhost:8007/wsdl/country?wsdl');
  record('SOAP WSDL Country Service', wsdlCountryRes.status === 200 && wsdlCountryRes.data.includes('<definitions name="CountryInfoService"'), `Country WSDL live`);

  const wsdlCurrencyRes = await axios.get('http://localhost:8006/wsdl/currency?wsdl');
  record('SOAP WSDL Currency Service', wsdlCurrencyRes.status === 200 && wsdlCurrencyRes.data.includes('<definitions name="CurrencyConversionService"'), `Currency WSDL live`);

  // Swagger UI Served
  const swaggerRes = await api.get('/api-docs/');
  record('Swagger UI Mounted on Gateway', swaggerRes.status === 200 && swaggerRes.data.includes('swagger-ui'), `Swagger UI active`);

  // Admin CRM Analytics
  const crmRes = await api.get('/api/v1/crm/summary', { headers: { Authorization: `Bearer ${adminToken}` } });
  record('Admin CRM Analytics', crmRes.status === 200 && typeof crmRes.data.deliveryRate === 'number', `Shipments Created: ${crmRes.data.counts?.SHIPMENT_CREATED || 0}, Delivered: ${crmRes.data.counts?.SHIPMENT_DELIVERED || 0}, Delivery Rate: ${(crmRes.data.deliveryRate * 100).toFixed(1)}%`, crmRes.status);

  // Record an audit log entry
  const recordAuditRes = await api.post('/api/v1/audit/logs', {
    action: 'ADMIN_VERIFICATION_AUDIT',
    service: 'api-gateway',
    severity: 'INFO',
    metadata: { reason: 'Master test verification' },
  });
  record('Audit Log Ingestion (POST /logs)', recordAuditRes.status === 201, `Audit entry recorded`, recordAuditRes.status);

  // Admin Audit Logs
  const auditRes = await api.get('/api/v1/audit/logs', { headers: { Authorization: `Bearer ${adminToken}` } });
  const logs = auditRes.data.data || auditRes.data.logs || [];
  record('Admin Audit Logs Retrieval', auditRes.status === 200 && Array.isArray(logs) && logs.length > 0, `Retrieved ${logs.length} immutable audit logs`, auditRes.status);

  // -------------------------------------------------------------
  // STATUS CODES SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('📊 DISTINCT HTTP STATUS CODES OBSERVED IN LIVE RUN:');
  const sortedCodes = Array.from(statusCodesObserved).sort();
  console.log(`   Codes: ${sortedCodes.join(', ')} (${sortedCodes.length} distinct codes)`);
  console.log('================================================================\n');

  console.log('🏁 MASTER VERIFICATION FINISHED: ALL TESTS PASSED!');
}

run().catch((err) => {
  console.error('\n💥 Master verification suite encountered an error:', err.response?.data || err.message);
  process.exit(1);
});
