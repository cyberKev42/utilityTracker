import { api } from '../api';

export async function getSections() {
  return api.get('/api/sections');
}

export async function getSectionsWithArchived() {
  return api.get('/api/sections?include_archived=true');
}

export async function createSection(data) {
  return api.post('/api/sections', data);
}

export async function updateSection(id, data) {
  return api.put(`/api/sections/${id}`, data);
}

export async function deleteSection(id) {
  return api.delete(`/api/sections/${id}`);
}

export async function archiveSection(id) {
  return api.post(`/api/sections/${id}/archive`);
}

export async function unarchiveSection(id) {
  return api.post(`/api/sections/${id}/unarchive`);
}

export async function reorderSections(order) {
  return api.put('/api/sections/reorder', { order });
}

export async function createMeter(sectionId, data) {
  return api.post(`/api/sections/${sectionId}/meters`, data);
}

export async function updateMeter(sectionId, meterId, data) {
  return api.put(`/api/sections/${sectionId}/meters/${meterId}`, data);
}

export async function deleteMeter(sectionId, meterId) {
  return api.delete(`/api/sections/${sectionId}/meters/${meterId}`);
}

export async function reorderMeters(sectionId, order) {
  return api.put(`/api/sections/${sectionId}/meters/reorder`, { order });
}
