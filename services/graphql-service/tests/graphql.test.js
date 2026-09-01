process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

jest.mock('../src/clients/shipmentClient');
jest.mock('../src/clients/trackingClient');
jest.mock('../src/clients/userClient');

const request = require('supertest');
const { signAccessToken } = require('@shiptrack/common');
const shipmentClient = require('../src/clients/shipmentClient');
const trackingClient = require('../src/clients/trackingClient');
const userClient = require('../src/clients/userClient');
const { buildApp } = require('../src/app');

let app;
const customerToken = signAccessToken({ sub: 'customer-1', role: 'CUSTOMER' });

beforeAll(async () => {
  app = await buildApp();
});

beforeEach(() => jest.clearAllMocks());

function gql(query, variables, token) {
  const req = request(app).post('/graphql').send({ query, variables });
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
}

describe('Query.trackShipment', () => {
  test('is public and resolves via shipment-service', async () => {
    shipmentClient.trackPublic.mockResolvedValue({
      trackingId: 'STK1', status: 'IN_TRANSIT', originCity: 'NYC', originCountry: 'US',
      destinationCity: 'LA', destinationCountry: 'US', estimatedDeliveryDate: '2026-09-10',
      actualDeliveryDate: null, updatedAt: new Date().toISOString(),
    });

    const res = await gql(`query($id: String!) { trackShipment(trackingId: $id) { status originCity } }`, { id: 'STK1' });

    expect(res.status).toBe(200);
    expect(res.body.data.trackShipment.status).toBe('IN_TRANSIT');
  });
});

describe('Query.shipment', () => {
  test('requires authentication', async () => {
    const res = await gql(`query($id: ID!) { shipment(id: $id) { id status } }`, { id: 'ship-1' });
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });

  test('forwards the caller token to shipment-service', async () => {
    shipmentClient.getById.mockResolvedValue({ id: 'ship-1', trackingId: 'STK1', status: 'CREATED' });
    const res = await gql(`query($id: ID!) { shipment(id: $id) { id status } }`, { id: 'ship-1' }, customerToken);
    expect(res.body.data.shipment.status).toBe('CREATED');
    expect(shipmentClient.getById).toHaveBeenCalledWith('ship-1', `Bearer ${customerToken}`, expect.anything());
  });
});

describe('Query.myDashboard', () => {
  test('aggregates profile and recent shipments for a customer', async () => {
    userClient.getMe.mockResolvedValue({ userId: 'customer-1', fullName: 'Ada Lovelace', email: 'ada@example.com' });
    shipmentClient.listMine.mockResolvedValue({
      data: [{ id: 'ship-1', trackingId: 'STK1', status: 'CREATED' }],
      pagination: { limit: 5, hasMore: false, nextCursor: null },
    });

    const res = await gql(
      `query { myDashboard { profile { fullName } recentShipments { trackingId } } }`,
      undefined,
      customerToken,
    );

    expect(res.body.data.myDashboard.profile.fullName).toBe('Ada Lovelace');
    expect(res.body.data.myDashboard.recentShipments).toHaveLength(1);
  });

  test('rejects a non-customer role', async () => {
    const adminToken = signAccessToken({ sub: 'admin-1', role: 'ADMIN' });
    const res = await gql(`query { myDashboard { recentShipments { id } } }`, undefined, adminToken);
    expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN');
  });
});

describe('Query.trackingEvents', () => {
  test('is public and returns the events list', async () => {
    trackingClient.listEvents.mockResolvedValue({
      data: [{ id: 'evt-1', trackingId: 'STK1', status: 'CREATED', timestamp: new Date().toISOString() }],
      pagination: { limit: 20, hasMore: false, nextCursor: null },
    });
    const res = await gql(`query($id: String!) { trackingEvents(trackingId: $id) { status } }`, { id: 'STK1' });
    expect(res.body.data.trackingEvents).toHaveLength(1);
    expect(res.body.data.trackingEvents[0].status).toBe('CREATED');
  });
});
