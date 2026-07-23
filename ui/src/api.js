const API = 'http://localhost:8000';

export const getToken = () => localStorage.getItem('access_token');
export const setToken = (t) => localStorage.setItem('access_token', t);
export const removeToken = () => localStorage.removeItem('access_token');

const authHeaders = () => ({
  'Authorization': `Bearer ${getToken()}`,
  'Content-Type': 'application/json',
});

export async function apiLogin(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Login failed');
  return data;
}

export async function apiSignup(email, password) {
  const res = await fetch(`${API}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Signup failed');
  return data;
}

export async function apiListDocuments() {
  const res = await fetch(`${API}/documents/list`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to load documents');
  return data;
}

export async function apiUploadDocument(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API}/documents/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Upload failed');
  return data;
}

export async function apiAsk(question, document_id) {
  const res = await fetch(`${API}/query/ask`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ question, document_id }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Query failed');
  return data;
}
