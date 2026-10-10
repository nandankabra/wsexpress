const axios = require('axios');

const BASE_URL = process.env.API_GATEWAY_URL || process.env.BASE_URL || 'http://localhost:8000';
const api = axios.create({ baseURL: BASE_URL, timeout: 25000 });

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failed++;
    throw new Error(message);
  }
  console.log(`  ✅ PASSED: ${message}`);
  passed++;
}

async function run() {
  console.log('🧪 Starting ShipTrack End-to-End Flow Verification...\n');

  // ==========================================
  // Flow 1: Auth, Registration & Magic OTP
  // ==========================================
  console.log('--- [Flow 1] User Registration & Verification ---');
  const timestamp = Date.now();
  const testUser = {
    name: `Flow Test User ${timestamp}`,
    email: `flow_user_${timestamp}@example.com`,
    password: 'Password123!',
  };

  const regRes = await api.post('/api/v1/auth/register', testUser);
  assert(regRes.status === 201, 'Registration returns HTTP 201 Created');
  assert(regRes.data.user.email === testUser.email, 'User email matches registration');

  // Verify email with Magic OTP 000000
  const verifyRes = await api.post('/api/v1/auth/verify-email', {
    email: testUser.email,
    otp: '000000',
  });
  assert(verifyRes.status === 200, 'Magic OTP 000000 verifies account successfully');

  // Login
  const loginRes = await api.post('/api/v1/auth/login', {
    email: testUser.email,
    password: testUser.password,
  });
  assert(loginRes.status === 200, 'Login returns HTTP 200 OK');
  assert(typeof loginRes.data.accessToken === 'string', 'Login returns valid JWT access token');
  const customerToken = loginRes.data.accessToken;
  const customerId = loginRes.data.user.id;

  const authMeRes = await api.get('/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  assert(authMeRes.data.email === testUser.email, '/auth/me returns authenticated customer profile');

  // ==========================================
  // Flow 2: Dynamic Pricing & Distance Engine
  // ==========================================
  console.log('\n--- [Flow 2] Pricing Engine & Distance Quotes ---');
  const quotePayload = {
    origin: { address: 'Connaught Place', city: 'New Delhi', country: 'IN' },
    destination: { address: 'Marine Drive', city: 'Mumbai', country: 'IN' },
    packageType: 'PARCEL',
    weightKg: 4.5,
  };

  const quoteRes = await api.post('/api/v1/shipments/quotes', quotePayload, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  assert(quoteRes.status === 200, 'Customer quote calculation returns HTTP 200 OK');
  assert(typeof quoteRes.data.priceAmount === 'number' && quoteRes.data.priceAmount > 0, `Dynamic price calculated (${quoteRes.data.currency} ${quoteRes.data.priceAmount})`);
  assert(['USD', 'INR'].includes(quoteRes.data.currency), `Quote currency is valid (${quoteRes.data.currency})`);
  const quoteData = quoteRes.data;

  // Currency Conversion
  const convertRes = await api.post('/api/v1/pricing/convert', {
    amount: 100,
    fromCurrency: 'USD',
    toCurrency: 'INR',
  });
  assert(convertRes.status === 200, 'Currency conversion USD -> INR returns HTTP 200 OK');
  assert(convertRes.data.convertedAmount > 0, `Converted $100 USD to INR: ₹${convertRes.data.convertedAmount}`);

  // ==========================================
  // Flow 3: Shipment Booking & Documents (PDF)
  // ==========================================
  console.log('\n--- [Flow 3] Shipment Booking & Document Generation ---');
  const shipmentPayload = {
    ...quotePayload,
    quotedPrice: quoteData.priceAmount,
    baseFare: quoteData.baseFare,
    distanceCharge: quoteData.distanceCharge,
    weightCharge: quoteData.weightCharge,
    taxAmount: quoteData.taxAmount,
    totalAmount: quoteData.totalAmount,
    currency: quoteData.currency,
  };

  const createShipmentRes = await api.post('/api/v1/shipments', shipmentPayload, {
    headers: {
      Authorization: `Bearer ${customerToken}`,
      'Idempotency-Key': `idemp-${timestamp}`,
    },
  });
  assert(createShipmentRes.status === 201, 'Shipment created successfully with HTTP 201');
  const shipment = createShipmentRes.data;
  assert(shipment.trackingId.startsWith('STK'), `Tracking number generated: ${shipment.trackingId}`);
  assert(shipment.status === 'CREATED', 'Initial shipment status is CREATED');
  assert(shipment.version === 1, 'Initial OCC version is 1');

  // Verify PDF Shipping Label
  const labelRes = await api.get(`/api/v1/shipments/${shipment.id}/label`, {
    headers: { Authorization: `Bearer ${customerToken}` },
    responseType: 'arraybuffer',
  });
  assert(labelRes.status === 200, 'Shipping label endpoint returns HTTP 200 OK');
  assert(labelRes.headers['content-type'] === 'application/pdf', 'Label Content-Type is application/pdf');
  assert(labelRes.data.length > 500, `Thermal Shipping Label PDF generated (${labelRes.data.length} bytes)`);

  // Verify PDF Commercial Invoice
  const invoiceRes = await api.get(`/api/v1/shipments/${shipment.id}/invoice`, {
    headers: { Authorization: `Bearer ${customerToken}` },
    responseType: 'arraybuffer',
  });
  assert(invoiceRes.status === 200, 'Invoice endpoint returns HTTP 200 OK');
  assert(invoiceRes.headers['content-type'] === 'application/pdf', 'Invoice Content-Type is application/pdf');
  assert(invoiceRes.data.length > 500, `Commercial Invoice PDF generated (${invoiceRes.data.length} bytes)`);

  // ==========================================
  // Flow 4: Admin Assignment & Fleet Management
  // ==========================================
  console.log('\n--- [Flow 4] Admin Dispatch & Carrier Assignment ---');
  const adminLoginRes = await api.post('/api/v1/auth/login', {
    email: 'admin@shiptrack.com',
    password: 'Admin@ShipTrack2026!',
  });
  assert(adminLoginRes.status === 200, 'Admin logged in successfully');
  const adminToken = adminLoginRes.data.accessToken;

  // List shipments as Admin
  const adminListRes = await api.get('/api/v1/shipments', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminListRes.status === 200, 'Admin can view fleet shipments monitoring pool');

  // Find Carrier Rahul
  const carrierRahulEmail = 'rahul@gmail.com';
  const carrierRahulPassword = 'Carrier@12345!';
  let rahulLoginRes;
  try {
    rahulLoginRes = await api.post('/api/v1/auth/login', {
      email: carrierRahulEmail,
      password: carrierRahulPassword,
    });
  } catch (err) {
    await api.post(
      '/api/v1/auth/admin/accounts',
      {
        name: 'Carrier Rahul',
        email: carrierRahulEmail,
        password: carrierRahulPassword,
        role: 'CARRIER',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    rahulLoginRes = await api.post('/api/v1/auth/login', {
      email: carrierRahulEmail,
      password: carrierRahulPassword,
    });
  }
  assert(rahulLoginRes.status === 200, 'Carrier Rahul logged in successfully');
  const carrierRahulToken = rahulLoginRes.data.accessToken;
  const carrierRahulId = rahulLoginRes.data.user.id;

  // Admin assigns shipment to Carrier Rahul
  const assignRes = await api.patch(
    `/api/v1/shipments/${shipment.id}/status`,
    {
      status: 'ASSIGNED',
      expectedVersion: shipment.version,
    },
    { headers: { Authorization: `Bearer ${carrierRahulToken}` } }
  );
  assert(assignRes.status === 200, 'Carrier claimed/assigned shipment successfully');
  assert(assignRes.data.status === 'ASSIGNED', 'Shipment status transitioned to ASSIGNED');
  let currentVersion = assignRes.data.version;

  // ==========================================
  // Flow 5: Carrier Milestones & GPS Telemetry
  // ==========================================
  console.log('\n--- [Flow 5] Carrier Telemetry & Scan Milestones ---');

  // Step 1: PICKED_UP with Delhi GPS coordinates
  const pickupRes = await api.patch(
    `/api/v1/shipments/${shipment.id}/status`,
    {
      status: 'PICKED_UP',
      expectedVersion: currentVersion,
      lat: 28.6139,
      lng: 77.2090,
      note: 'Package picked up from origin address',
    },
    { headers: { Authorization: `Bearer ${carrierRahulToken}` } }
  );
  assert(pickupRes.status === 200, 'Milestone updated to PICKED_UP');
  assert(pickupRes.data.status === 'PICKED_UP', 'Status is PICKED_UP');
  currentVersion = pickupRes.data.version;

  // Step 2: ARRIVED_AT_HUB
  const hubRes = await api.patch(
    `/api/v1/shipments/${shipment.id}/status`,
    {
      status: 'ARRIVED_AT_HUB',
      expectedVersion: currentVersion,
      hubId: 'HUB_DEL',
      lat: 28.5355,
      lng: 77.3910,
      note: 'Package arrived at Delhi Sorting Hub',
    },
    { headers: { Authorization: `Bearer ${carrierRahulToken}` } }
  );
  assert(hubRes.status === 200, 'Milestone updated to ARRIVED_AT_HUB');
  currentVersion = hubRes.data.version;

  // Step 3: IN_TRANSIT
  const transitRes = await api.patch(
    `/api/v1/shipments/${shipment.id}/status`,
    {
      status: 'IN_TRANSIT',
      expectedVersion: currentVersion,
      lat: 23.0225,
      lng: 72.5714,
      note: 'In-transit highway express transit',
    },
    { headers: { Authorization: `Bearer ${carrierRahulToken}` } }
  );
  assert(transitRes.status === 200, 'Milestone updated to IN_TRANSIT');
  currentVersion = transitRes.data.version;

  // Step 4: ARRIVED_AT_HUB (Destination)
  const destHubRes = await api.patch(
    `/api/v1/shipments/${shipment.id}/status`,
    {
      status: 'ARRIVED_AT_HUB',
      expectedVersion: currentVersion,
      hubId: 'HUB_MUM',
      lat: 19.0760,
      lng: 72.8777,
      note: 'Package arrived at Mumbai Gateway Hub',
    },
    { headers: { Authorization: `Bearer ${carrierRahulToken}` } }
  );
  assert(destHubRes.status === 200, 'Milestone updated to destination ARRIVED_AT_HUB');
  currentVersion = destHubRes.data.version;

  // Step 5: OUT_FOR_DELIVERY
  const outDeliveryRes = await api.patch(
    `/api/v1/shipments/${shipment.id}/status`,
    {
      status: 'OUT_FOR_DELIVERY',
      expectedVersion: currentVersion,
      lat: 18.9220,
      lng: 72.8347,
      note: 'Driver out for final mile delivery',
    },
    { headers: { Authorization: `Bearer ${carrierRahulToken}` } }
  );
  assert(outDeliveryRes.status === 200, 'Milestone updated to OUT_FOR_DELIVERY');
  currentVersion = outDeliveryRes.data.version;

  // Step 6: DELIVERED
  const deliveredRes = await api.patch(
    `/api/v1/shipments/${shipment.id}/status`,
    {
      status: 'DELIVERED',
      expectedVersion: currentVersion,
      lat: 18.9220,
      lng: 72.8347,
      note: 'Delivered to recipient. Signature verified.',
    },
    { headers: { Authorization: `Bearer ${carrierRahulToken}` } }
  );
  assert(deliveredRes.status === 200, 'Milestone updated to DELIVERED');
  assert(deliveredRes.data.status === 'DELIVERED', 'Final status is DELIVERED');

  // ==========================================
  // Flow 6: Public Tracking & Timeline
  // ==========================================
  console.log('\n--- [Flow 6] Public Tracking & Audit Timeline ---');
  const publicTrackRes = await api.get(`/api/v1/shipments/track/${shipment.trackingId}`);
  assert(publicTrackRes.status === 200, 'Public tracking lookup returns HTTP 200 without auth');
  assert(publicTrackRes.data.status === 'DELIVERED', 'Public tracking reports status as DELIVERED');
  assert(publicTrackRes.data.originCity === 'New Delhi', 'Public tracking shows origin city New Delhi');
  assert(publicTrackRes.data.destinationCity === 'Mumbai', 'Public tracking shows destination city Mumbai');

  // Tracking event log
  const trackingEventsRes = await api.get(`/api/v1/tracking/${shipment.trackingId}/events`);
  assert(trackingEventsRes.status === 200, 'Tracking events list returns HTTP 200 OK');
  const eventsList = trackingEventsRes.data.data || trackingEventsRes.data.events;
  assert(Array.isArray(eventsList), 'Events list is an array');
  assert(eventsList.length >= 6, `Recorded full milestone audit trail (${eventsList.length} events logged)`);

  // ==========================================
  // Flow 7: Admin CRM Analytics & Audit Logs
  // ==========================================
  console.log('\n--- [Flow 7] Admin CRM Analytics & Audit Logs ---');
  const crmSummaryRes = await api.get('/api/v1/crm/summary', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(crmSummaryRes.status === 200, 'CRM summary analytics returns HTTP 200 OK for Admin');
  assert(typeof crmSummaryRes.data.deliveryRate === 'number', `CRM delivery rate computed: ${(crmSummaryRes.data.deliveryRate * 100).toFixed(1)}%`);

  const auditLogsRes = await api.get('/api/v1/audit/logs', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(auditLogsRes.status === 200, 'Audit logs list returns HTTP 200 OK for Admin');
  const logsList = auditLogsRes.data.data || auditLogsRes.data.logs;
  assert(Array.isArray(logsList), 'Audit logs data is an array');

  // ==========================================
  // Flow 8: GraphQL Gateway
  // ==========================================
  console.log('\n--- [Flow 8] GraphQL Query Flow ---');
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
  assert(gqlRes.status === 200, 'GraphQL query returns HTTP 200 OK');
  assert(gqlRes.data.data.trackShipment.status === 'DELIVERED', 'GraphQL trackShipment resolves status correctly');

  // Summary
  console.log('\n==============================================');
  console.log(`🏁 All flows verified successfully!`);
  console.log(`   Passed: ${passed} checks`);
  console.log(`   Failed: ${failed} checks`);
  console.log('==============================================\n');
}

run().catch((err) => {
  console.error('\n💥 Flow verification error:', err.response?.data || err.message);
  process.exit(1);
});
