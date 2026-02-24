import { supabase } from './lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || '';

async function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  }
  return headers;
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.error || `API Error: ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  async get(endpoint) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: await getHeaders(),
    });
    return handleResponse(res);
  },

  async post(endpoint, data) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async put(endpoint, data) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async delete(endpoint) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return handleResponse(res);
  },
};
