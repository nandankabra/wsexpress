import api from './axiosClient';

export async function processPayment(payload, idempotencyKey) {
  const headers = {};
  if (idempotencyKey) {
    headers['X-Idempotency-Key'] = idempotencyKey;
  }
  const { data } = await api.post('/api/v1/payments/process', payload, { headers });
  return data;
}

export async function getOrderPayments(orderId) {
  const { data } = await api.get(`/api/v1/payments/order/${orderId}`);
  return data;
}
