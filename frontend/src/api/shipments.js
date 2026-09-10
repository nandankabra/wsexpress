import apiClient from './axiosClient';

export const getQuote = (body) => apiClient.post('/shipments/quotes', body).then((r) => r.data);
export const createShipment = (body, idempotencyKey) =>
  apiClient
    .post('/shipments', body, { headers: { 'Idempotency-Key': idempotencyKey } })
    .then((r) => r.data);
export const listShipments = (params) => apiClient.get('/shipments', { params }).then((r) => r.data);
export const getShipment = (id) => apiClient.get(`/shipments/${id}`).then((r) => r.data);
export const trackPublic = (trackingId) =>
  apiClient.get(`/shipments/track/${trackingId}`).then((r) => r.data);
export const updateShipmentStatus = (id, body) =>
  apiClient.patch(`/shipments/${id}/status`, body).then((r) => r.data);
export const assignCarrier = (id, carrierId, expectedVersion) =>
  apiClient.patch(`/shipments/${id}/assign-carrier`, { carrierId, expectedVersion }).then((r) => r.data);
export const updateDelivery = (id, body) =>
  apiClient.patch(`/shipments/${id}/delivery`, body).then((r) => r.data);
