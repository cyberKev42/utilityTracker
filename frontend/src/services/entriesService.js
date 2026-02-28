import { api } from '../api';

export async function createEntry(entryData) {
  return api.post('/api/entries', entryData);
}

export async function getEntries(filters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  const query = params.toString();
  return api.get(`/api/entries${query ? `?${query}` : ''}`);
}

export async function getStats() {
  return api.get('/api/entries/stats');
}

export async function deleteEntry(id) {
  return api.delete(`/api/entries/${id}`);
}

export async function getTrend() {
  return api.get('/api/entries/trend');
}

export async function getBreakdown(type, year, month) {
  const params = new URLSearchParams({ year: String(year) });
  if (month != null) params.set('month', String(month));
  return api.get(`/api/entries/breakdown/${type}?${params.toString()}`);
}
