import apiClient from './axiosClient';

export const register = (body, idempotencyKey) => 
  apiClient.post('/auth/register', body, { headers: { 'Idempotency-Key': idempotencyKey } }).then((r) => r.data);
export const login = (body) => apiClient.post('/auth/login', body).then((r) => r.data);
export const logout = (refreshToken) => apiClient.post('/auth/logout', { refreshToken }).then((r) => r.data);
export const getMe = () => apiClient.get('/auth/me').then((r) => r.data);
export const adminCreateAccount = (body, idempotencyKey) => 
  apiClient.post('/auth/admin/accounts', body, { headers: { 'Idempotency-Key': idempotencyKey } }).then((r) => r.data);

export const verifyEmail = (body) => apiClient.post('/auth/verify-email', body).then((r) => r.data);
export const forgotPassword = (body) => apiClient.post('/auth/forgot-password', body).then((r) => r.data);
export const resetPassword = (body) => apiClient.post('/auth/reset-password', body).then((r) => r.data);
