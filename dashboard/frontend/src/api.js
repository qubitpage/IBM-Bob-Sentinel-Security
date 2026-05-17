const normalizeApiBase = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return 'http://localhost:3000/api';
  return trimmed.replace(/\/$/, '');
};

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE || 'http://localhost:3000/api');

export default API_BASE;