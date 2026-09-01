import apiClient from './axiosClient';

export const listCountries = () => apiClient.get('/locations/countries').then((r) => r.data);
