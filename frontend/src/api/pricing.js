import api from './axiosClient';

export async function getPricingConfig() {
  const { data } = await api.get('/api/v1/pricing/config');
  return data;
}

export async function updatePricingConfig(config) {
  const { data } = await api.put('/api/v1/pricing/config', config);
  return data;
}

export async function getPricingQuote(payload) {
  const { data } = await api.post('/api/v1/pricing/quote', payload);
  return data;
}
