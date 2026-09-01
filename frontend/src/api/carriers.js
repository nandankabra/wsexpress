import apiClient from './axiosClient';

export const getMyCarrierProfile = () => apiClient.get('/carriers/me').then((r) => r.data);
export const upsertMyCarrierProfile = (body) => apiClient.put('/carriers/me', body).then((r) => r.data);
export const listCarriers = (params) => apiClient.get('/carriers', { params }).then((r) => r.data);
export const verifyCarrier = (userId, isVerified) =>
  apiClient.patch(`/carriers/${userId}/verify`, { isVerified }).then((r) => r.data);
