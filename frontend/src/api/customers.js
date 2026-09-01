import apiClient from './axiosClient';

export const getMyProfile = () => apiClient.get('/customers/me').then((r) => r.data);
export const upsertMyProfile = (body) => apiClient.put('/customers/me', body).then((r) => r.data);
export const listCustomers = (params) => apiClient.get('/customers', { params }).then((r) => r.data);
