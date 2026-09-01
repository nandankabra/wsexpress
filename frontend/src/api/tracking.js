import apiClient from './axiosClient';

export const listTrackingEvents = (trackingId, params) =>
  apiClient.get(`/tracking/${trackingId}/events`, { params }).then((r) => r.data);
export const addTrackingEvent = (trackingId, body) =>
  apiClient.post(`/tracking/${trackingId}/events`, body).then((r) => r.data);
