import { api } from '../api';

export async function register(email, password) {
  return api.post('/api/auth/register', { email, password });
}

export async function login(email, password) {
  return api.post('/api/auth/login', { email, password });
}

export async function getMe() {
  return api.get('/api/auth/me');
}
