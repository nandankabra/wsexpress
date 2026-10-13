process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

jest.mock('../src/models/shipmentModel');

const request = require('supertest');
const { signAccessToken } = require('@shiptrack/common');
const shipmentModel = require('../src/models/shipmentModel');
const { buildApp } = require('../src/app');

const app = buildApp();
const adminToken = signAccessToken({ sub: 'admin-1', role: 'ADMIN' });
const customerToken = signAccessToken({ sub: 'customer-1', role: 'CUSTOMER' });

const mockOrders = [
  {
    id: 'b1111111-1111-4111-8111-111111111111',
    tracking_id: 'STKNEWEST01',
    order_number: 'ORD-STKNEWEST01',
    customer_id: 'cust-1',
    origin_city: 'New Delhi',
    destination_city: 'Mumbai',
    total_amount: 450,
    order_status: 'CONFIRMED',
    payment_status: 'PAID',
    status: 'CREATED',
    created_at: new Date(Date.now()).toISOString(),
    version: 1,
  },
  {
    id: 'b2222222-2222-4222-8222-222222222222',
    tracking_id: 'STKOLDER02',
    order_number: 'ORD-STKOLDER02',
    customer_id: 'cust-2',
    origin_city: 'Bengaluru',
    destination_city: 'Chennai',
    total_amount: 320,
    order_status: 'PENDING_PAYMENT',
    payment_status: 'AWAITING_PAYMENT',
    status: 'CREATED',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    version: 1,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/v1/shipments/admin/orders (Admin Order Management)', () => {
  test('rejects non-admin users with HTTP 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/shipments/admin/orders')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });

  test('returns paginated orders with newest first by default and KPI summaries', async () => {
    shipmentModel.listOrdersAdmin.mockResolvedValue({
      rows: mockOrders,
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
      summary: {
        totalOrders: 2,
        pendingOrders: 1,
        awaitingPayment: 1,
        paidOrders: 1,
        processingOrders: 1,
        inTransitOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        failedRefundedOrders: 0,
        totalRevenue: 450,
      },
    });

    const res = await request(app)
      .get('/api/v1/shipments/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].orderNumber).toBe('ORD-STKNEWEST01');
    expect(res.body.summary.totalOrders).toBe(2);
    expect(res.body.summary.totalRevenue).toBe(450);
  });
});

describe('PATCH /api/v1/shipments/admin/orders/:id/action (Admin Actions)', () => {
  test('rejects unauthorized non-admin callers with 403', async () => {
    const res = await request(app)
      .patch('/api/v1/shipments/admin/orders/b1111111-1111-4111-8111-111111111111/action')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ action: 'CONFIRM_ORDER' });

    expect(res.status).toBe(403);
  });

  test('admin can confirm order state', async () => {
    shipmentModel.findById.mockResolvedValue(mockOrders[0]);
    shipmentModel.updatePaymentStatus.mockResolvedValue({
      ...mockOrders[0],
      order_status: 'CONFIRMED',
    });

    const res = await request(app)
      .patch('/api/v1/shipments/admin/orders/b1111111-1111-4111-8111-111111111111/action')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'CONFIRM_ORDER' });

    expect(res.status).toBe(200);
    expect(res.body.orderStatus).toBe('CONFIRMED');
  });

  test('admin can cancel order and updates payment status accordingly', async () => {
    shipmentModel.findById.mockResolvedValue(mockOrders[0]);
    shipmentModel.updateStatus.mockResolvedValue({
      ...mockOrders[0],
      status: 'CANCELLED',
    });
    shipmentModel.updatePaymentStatus.mockResolvedValue({
      ...mockOrders[0],
      status: 'CANCELLED',
      order_status: 'CANCELLED',
      payment_status: 'REFUNDED',
    });

    const res = await request(app)
      .patch('/api/v1/shipments/admin/orders/b1111111-1111-4111-8111-111111111111/action')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'CANCEL_ORDER' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
    expect(res.body.orderStatus).toBe('CANCELLED');
  });
});
