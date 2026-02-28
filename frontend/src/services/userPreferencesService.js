import { api } from '../api';

export async function getCurrency() {
  return api.get('/api/preferences/currency');
}

export async function updateCurrency(currency) {
  return api.put('/api/preferences/currency', { currency });
}
