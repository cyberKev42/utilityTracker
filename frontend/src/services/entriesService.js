import { api } from '../api';

export async function createEntry(entryData) {
  return api.post('/api/entries', entryData);
}

export async function getEntries() {
  return api.get('/api/entries');
}

export async function getStats() {
  return api.get('/api/entries/stats');
}

export async function deleteEntry(id) {
  return api.delete(`/api/entries/${id}`);
}
