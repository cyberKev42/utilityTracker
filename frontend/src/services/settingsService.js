import { api } from '../api';

export async function getUnitPrice(type) {
  return api.get(`/api/settings/${type}`);
}

export async function updateUnitPrice(type, unitPrice) {
  return api.put(`/api/settings/${type}`, { unit_price: unitPrice });
}
