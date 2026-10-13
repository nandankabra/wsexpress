import api from './axiosClient';

export async function getPricingConfig() {
  const { data } = await api.get('/pricing/config');
  return data;
}

export async function updatePricingConfig(config) {
  const { data } = await api.put('/pricing/config', config);
  return data;
}

export async function getPricingQuote(payload) {
  const { data } = await api.post('/pricing/quote', payload);
  return data;
}
