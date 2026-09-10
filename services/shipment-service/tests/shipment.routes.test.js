process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

jest.mock('../src/models/shipmentModel');
jest.mock('../src/clients/pricingClient');
jest.mock('../src/clients/trackingClient');
jest.mock('../src/clients/crmClient');

const request = require('supertest');
const { signAccessToken } = require('@shiptrack/common');
const shipmentModel = require('../src/models/shipmentModel');
const pricingClient = require('../src/clients/pricingClient');
const trackingClient = require('../src/clients/trackingClient');
const crmClient = require('../src/clients/crmClient');
const { buildApp } = require('../src/app');

const app = buildApp();
const customerToken = signAccessToken({ sub: 'customer-1', role: 'CUSTOMER' });
const carrierToken = signAccessToken({ sub: 'carrier-1', role: 'CARRIER' });
const adminToken = signAccessToken({ sub: 'admin-1', role: 'ADMIN' });

const dbRow = {
  id: 'ship-1',
  tracking_id: 'STKABC123',
  customer_id: 'customer-1',
  carrier_id: null,
  origin_address: '1 Main St',
  origin_city: 'NYC',
  origin_country: 'US',
  destination_address: '2 Side St',
  destination_city: 'LA',
  destination_country: 'US',
  weight_kg: '2.50',
  package_type: 'PARCEL',
  status: 'CREATED',
  quoted_price: '25.00',
  currency: 'USD',
  estimated_delivery_date: '2026-09-10',
  actual_delivery_date: null,
  delivery_notes: null,
  version: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const validBody = {
  origin: { address: '1 Main St', city: 'NYC', country: 'US' },
  destination: { address: '2 Side St', city: 'LA', country: 'US' },
  weightKg: 2.5,
  packageType: 'PARCEL',
};

beforeEach(() => jest.clearAllMocks());

describe('POST /api/v1/shipments/quotes', () => {
  test('reshapes the nested origin/destination body into pricing-service\'s flat contract', async () => {
    pricingClient.getQuote.mockResolvedValue({ priceAmount: 16.5, currency: 'USD', estimatedDays: 8 });
    const res = await request(app)
      .post('/api/v1/shipments/quotes')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(validBody);
    expect(res.status).toBe(200);
    expect(pricingClient.getQuote).toHaveBeenCalledWith(
      expect.objectContaining({ originCountry: 'US', destinationCountry: 'US', weightKg: 2.5 }),
      expect.anything(),
    );
  });
});

describe('POST /api/v1/shipments', () => {
  test('rejects non-customer roles', async () => {
    const res = await request(app)
      .post('/api/v1/shipments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validBody);
    expect(res.status).toBe(403);
  });

  test('creates a shipment using the pricing quote and records a tracking event', async () => {
    pricingClient.getQuote.mockResolvedValue({ priceAmount: 25, currency: 'USD', estimatedDays: 5 });
    shipmentModel.create.mockResolvedValue(dbRow);
    trackingClient.recordEvent.mockResolvedValue(null);
    crmClient.recordEvent.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/shipments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.trackingId).toBe('STKABC123');
    expect(res.body.quotedPrice).toBe(25);
    expect(trackingClient.recordEvent).toHaveBeenCalledWith(
      'STKABC123',
      expect.objectContaining({ status: 'CREATED' }),
      expect.anything(),
    );
    expect(crmClient.recordEvent).toHaveBeenCalledWith(
      'SHIPMENT_CREATED',
      expect.objectContaining({ entityId: 'ship-1', customerId: 'customer-1' }),
      expect.anything(),
    );
  });
});

describe('GET /api/v1/shipments/track/:trackingId', () => {
  test('is public and returns limited fields', async () => {
    shipmentModel.findByTrackingId.mockResolvedValue(dbRow);
    const res = await request(app).get('/api/v1/shipments/track/STKABC123');
    expect(res.status).toBe(200);
    expect(res.body.trackingId).toBe('STKABC123');
    expect(res.body.customerId).toBeUndefined();
  });

  test('returns 404 for an unknown tracking id', async () => {
    shipmentModel.findByTrackingId.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/shipments/track/NOPE');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/shipments/:id', () => {
  test('forbids a customer viewing someone else\'s shipment', async () => {
    shipmentModel.findById.mockResolvedValue({ ...dbRow, customer_id: 'other-customer' });
    const res = await request(app).get('/api/v1/shipments/ship-1').set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  test('allows the owning customer', async () => {
    shipmentModel.findById.mockResolvedValue(dbRow);
    const res = await request(app).get('/api/v1/shipments/ship-1').set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.headers.etag).toBeDefined();
  });
});

describe('GET /api/v1/shipments (carrier scope)', () => {
  test('a carrier sees their own assigned and unassigned (claimable) shipments', async () => {
    shipmentModel.listPage.mockResolvedValue([dbRow]);
    const res = await request(app).get('/api/v1/shipments').set('Authorization', `Bearer ${carrierToken}`);
    expect(res.status).toBe(200);
    expect(shipmentModel.listPage).toHaveBeenCalledWith(
      expect.objectContaining({ carrierScope: 'carrier-1' }),
    );
    expect(shipmentModel.listPage.mock.calls[0][0].carrierId).toBeUndefined();
  });
});

describe('PATCH /api/v1/shipments/:id/status', () => {
  test('rejects an invalid state transition', async () => {
    shipmentModel.findById.mockResolvedValue({ ...dbRow, status: 'DELIVERED', assigned_driver_id: 'carrier-1' });
    const res = await request(app)
      .patch('/api/v1/shipments/ship-1/status')
      .set('Authorization', `Bearer ${carrierToken}`)
      .send({ status: 'IN_TRANSIT', expectedVersion: 1 });
    expect(res.status).toBe(422);
  });

  test('returns 412 on a version mismatch', async () => {
    shipmentModel.findById.mockResolvedValue({ ...dbRow, assigned_driver_id: 'carrier-1' });
    shipmentModel.updateStatus.mockResolvedValue(null);
    const res = await request(app)
      .patch('/api/v1/shipments/ship-1/status')
      .set('Authorization', `Bearer ${carrierToken}`)
      .send({ status: 'ASSIGNED', expectedVersion: 99 });
    expect(res.status).toBe(412);
  });

  test('updates status and fires a tracking event, but no CRM event for a non-terminal status', async () => {
    shipmentModel.findById.mockResolvedValue({ ...dbRow, assigned_driver_id: 'carrier-1' });
    shipmentModel.updateStatus.mockResolvedValue({ ...dbRow, status: 'ASSIGNED', assigned_driver_id: 'carrier-1', version: 2 });
    trackingClient.recordEvent.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/v1/shipments/ship-1/status')
      .set('Authorization', `Bearer ${carrierToken}`)
      .send({ status: 'ASSIGNED', expectedVersion: 1 });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ASSIGNED');
    expect(trackingClient.recordEvent).toHaveBeenCalled();
    expect(crmClient.recordEvent).not.toHaveBeenCalled();
  });

  test('transitioning to DELIVERED records a SHIPMENT_DELIVERED CRM event', async () => {
    const outForDelivery = { ...dbRow, status: 'OUT_FOR_DELIVERY', carrier_id: 'carrier-1', assigned_driver_id: 'carrier-1' };
    shipmentModel.findById.mockResolvedValue(outForDelivery);
    shipmentModel.updateStatus.mockResolvedValue({ ...outForDelivery, status: 'DELIVERED', version: 5 });
    trackingClient.recordEvent.mockResolvedValue(null);
    crmClient.recordEvent.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/v1/shipments/ship-1/status')
      .set('Authorization', `Bearer ${carrierToken}`)
      .send({ status: 'DELIVERED', expectedVersion: 4 });

    expect(res.status).toBe(200);
    expect(crmClient.recordEvent).toHaveBeenCalledWith(
      'SHIPMENT_DELIVERED',
      expect.objectContaining({ entityId: 'ship-1', carrierId: 'carrier-1' }),
      expect.anything(),
    );
  });
});
