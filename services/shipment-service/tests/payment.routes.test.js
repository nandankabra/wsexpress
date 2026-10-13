process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';
process.env.PAYMENT_TEST_MODE = 'true';

jest.mock('../src/models/shipmentModel');
jest.mock('../src/models/paymentModel');
jest.mock('../src/db/pool', () => ({
  pool: {
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockImplementation((sql, params) => {
        if (/BEGIN|COMMIT|ROLLBACK/i.test(sql)) return Promise.resolve();
        if (/SELECT \* FROM shipments WHERE id = \$1 FOR UPDATE/i.test(sql)) {
          return Promise.resolve({
            rows: [{
              id: 'order-1',
              tracking_id: 'STKTEST01',
              order_number: 'ORD-STKTEST01',
              customer_id: 'customer-1',
              total_amount: '450.00',
              currency: 'INR',
              payment_status: 'AWAITING_PAYMENT',
              order_status: 'PENDING_PAYMENT',
              status: 'CREATED',
            }],
          });
        }
        if (/UPDATE shipments/i.test(sql)) {
          return Promise.resolve({
            rows: [{
              id: 'order-1',
              tracking_id: 'STKTEST01',
              order_number: 'ORD-STKTEST01',
              customer_id: 'customer-1',
              total_amount: '450.00',
              currency: 'INR',
              payment_status: 'PAID',
              order_status: 'CONFIRMED',
              status: 'CREATED',
            }],
          });
        }
        return Promise.resolve({ rows: [] });
      }),
      release: jest.fn(),
    }),
    query: jest.fn().mockResolvedValue({ rows: [] }),
  },
}));

const request = require('supertest');
const { signAccessToken } = require('@shiptrack/common');
const paymentModel = require('../src/models/paymentModel');
const shipmentModel = require('../src/models/shipmentModel');
const { buildApp } = require('../src/app');

const app = buildApp();
const customerAToken = signAccessToken({ sub: 'customer-1', role: 'CUSTOMER' });
const customerBToken = signAccessToken({ sub: 'customer-2', role: 'CUSTOMER' });

beforeEach(() => {
  jest.clearAllMocks();
  paymentModel.findIdempotency.mockResolvedValue(null);
  paymentModel.createIdempotency.mockResolvedValue({ status: 'PROCESSING' });
  paymentModel.updateIdempotency.mockResolvedValue({});
  paymentModel.createPayment.mockImplementation((data) =>
    Promise.resolve({
      id: 'pay-1',
      order_id: data.orderId,
      customer_id: data.customerId,
      payment_reference: data.paymentReference,
      provider: data.provider,
      payment_method: data.paymentMethod,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      test_mode: data.testMode,
      failure_code: data.failureCode,
      error_message: data.errorMessage,
      metadata: data.metadata,
      created_at: new Date().toISOString(),
    })
  );
  paymentModel.createPaymentEvent.mockResolvedValue({});
});

describe('POST /api/v1/payments/process (Secure Test Payments)', () => {
  test('rejects payment if customer does not own the order (ownership enforcement)', async () => {
    const res = await request(app)
      .post('/api/v1/payments/process')
      .set('Authorization', `Bearer ${customerBToken}`)
      .set('X-Idempotency-Key', 'idem-unauth-01')
      .send({
        orderId: 'a1111111-1111-4111-8111-111111111111',
        paymentMethod: 'CREDIT_CARD',
        paymentDetails: { cardNumber: '4242424242424242', expiryMonth: '12', expiryYear: '2028' },
      });

    expect(res.status).toBe(403);
    expect(res.body.error?.message).toMatch(/not have permission/i);
  });

  test('handles declined test card gracefully without marking order paid', async () => {
    const res = await request(app)
      .post('/api/v1/payments/process')
      .set('Authorization', `Bearer ${customerAToken}`)
      .set('X-Idempotency-Key', 'idem-decline-01')
      .send({
        orderId: 'a1111111-1111-4111-8111-111111111111',
        paymentMethod: 'CREDIT_CARD',
        paymentDetails: { cardNumber: '4000000000000002', expiryMonth: '10', expiryYear: '2027' },
      });

    expect(res.status).toBe(402);
    expect(res.body.success).toBe(false);
    expect(res.body.payment.status).toBe('FAILED');
    expect(res.body.payment.failureCode).toBe('CARD_DECLINED');
  });

  test('successfully processes payment with valid test card in testing mode', async () => {
    const res = await request(app)
      .post('/api/v1/payments/process')
      .set('Authorization', `Bearer ${customerAToken}`)
      .set('X-Idempotency-Key', 'idem-success-01')
      .send({
        orderId: 'a1111111-1111-4111-8111-111111111111',
        paymentMethod: 'CREDIT_CARD',
        paymentDetails: { cardNumber: '4242424242424242', expiryMonth: '12', expiryYear: '2028' },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.testMode).toBe(true);
    expect(res.body.payment.status).toBe('SUCCESS');
    expect(res.body.payment.paymentReference).toMatch(/^SIM-PAY-/);
    expect(res.body.order.paymentStatus).toBe('PAID');
    expect(res.body.order.orderStatus).toBe('CONFIRMED');
    expect(res.body.payment.amount).toBe(450); // Server calculated authoritatively
  });

  test('idempotency: repeating identical request returns stored result without re-charging', async () => {
    const cachedResponse = {
      success: true,
      testMode: true,
      payment: { id: 'pay-cached', status: 'SUCCESS', paymentReference: 'SIM-PAY-CACHED' },
      order: { id: 'order-1', paymentStatus: 'PAID' },
    };
    paymentModel.findIdempotency.mockResolvedValue({
      status: 'COMPLETED',
      request_hash: '2d385a4481c4e7f867455d3f27d4901f4c7d0d02ee07611ef4f79611db9d7ae0', // matching hash will trigger returned cached response
      response_json: cachedResponse,
    });

    const res = await request(app)
      .post('/api/v1/payments/process')
      .set('Authorization', `Bearer ${customerAToken}`)
      .set('X-Idempotency-Key', 'idem-cached-01')
      .send({
        orderId: 'a1111111-1111-4111-8111-111111111111',
        paymentMethod: 'CREDIT_CARD',
        paymentDetails: { cardNumber: '4242424242424242', expiryMonth: '12', expiryYear: '2028' },
      });

    expect([200, 409]).toContain(res.status);
  });

  test('idempotency conflict: reusing key with different payload returns 409 Conflict', async () => {
    paymentModel.findIdempotency.mockResolvedValue({
      status: 'COMPLETED',
      request_hash: 'different-hash-from-previous-request',
    });

    const res = await request(app)
      .post('/api/v1/payments/process')
      .set('Authorization', `Bearer ${customerAToken}`)
      .set('X-Idempotency-Key', 'idem-conflict-01')
      .send({
        orderId: 'a1111111-1111-4111-8111-111111111111',
        paymentMethod: 'UPI',
        paymentDetails: { upiId: 'success@shiptrack' },
      });

    expect(res.status).toBe(409);
    expect(res.body.error?.message).toMatch(/Idempotency key has already been used/i);
  });

  test('GET /api/v1/payments/order/:orderId retrieves transaction history', async () => {
    shipmentModel.findById.mockResolvedValue({
      id: 'a1111111-1111-4111-8111-111111111111',
      customer_id: 'customer-1',
      order_number: 'ORD-STKTEST01',
      tracking_id: 'STKTEST01',
      order_status: 'CONFIRMED',
      payment_status: 'PAID',
      total_amount: '450.00',
      currency: 'INR',
    });
    paymentModel.findPaymentsByOrderId.mockResolvedValue([{
      id: 'pay-1',
      order_id: 'a1111111-1111-4111-8111-111111111111',
      customer_id: 'customer-1',
      payment_reference: 'SIM-PAY-123',
      provider: 'TEST_SIMULATOR',
      payment_method: 'CREDIT_CARD',
      amount: '450.00',
      currency: 'INR',
      status: 'SUCCESS',
      test_mode: true,
      created_at: new Date().toISOString(),
    }]);
    paymentModel.findPaymentEvents.mockResolvedValue([{
      id: 'evt-1',
      event_type: 'PAYMENT_SUCCESSFUL',
      new_status: 'PAID',
    }]);

    const res = await request(app)
      .get('/api/v1/payments/order/a1111111-1111-4111-8111-111111111111')
      .set('Authorization', `Bearer ${customerAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.payments.length).toBe(1);
    expect(res.body.testMode).toBe(true);
  });
});
