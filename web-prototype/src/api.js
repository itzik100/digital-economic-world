const BASE = import.meta.env?.VITE_API_URL || 'http://localhost:4000/api';
let _token = null;

async function parseResponse(res) {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

function headers(extra = {}) {
  return {
    ...extra,
    ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
  };
}

export const API = {
  setToken(t) { _token = t; },
  clearToken() { _token = null; },

  async get(path) {
    const res = await fetch(BASE + path, {
      headers: headers()
    });
    return parseResponse(res);
  },

  async post(path, body) {
    const res = await fetch(BASE + path, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body)
    });
    return parseResponse(res);
  },

  async patch(path, body) {
    const res = await fetch(BASE + path, {
      method: 'PATCH',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body)
    });
    return parseResponse(res);
  }
};
