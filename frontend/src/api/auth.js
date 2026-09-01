import apiClient from './axiosClient';

export const register = (body) => apiClient.post('/auth/register', body).then((r) => r.data);
export const login = (body) => apiClient.post('/auth/login', body).then((r) => r.data);
export const logout = (refreshToken) => apiClient.post('/auth/logout', { refreshToken }).then((r) => r.data);
export const getMe = () => apiClient.get('/auth/me').then((r) => r.data);
export const adminCreateAccount = (body) => apiClient.post('/auth/admin/accounts', body).then((r) => r.data);
