import apiClient from './axiosClient';

export const getAnalyticsSummary = () => apiClient.get('/crm/summary').then((r) => r.data);
export const getTopCustomers = (limit = 10) =>
  apiClient.get('/crm/customers/top', { params: { limit } }).then((r) => r.data);
export const getCarrierPerformance = (limit = 10) =>
  apiClient.get('/crm/carriers/performance', { params: { limit } }).then((r) => r.data);
