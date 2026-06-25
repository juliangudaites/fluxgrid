const TOKEN_KEY = 'fluxgrid_admin_token';

export function getAdminToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function adminFetch(path: string, options: RequestInit = {}) {
  const token = getAdminToken();
  const res = await fetch(`/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    clearAdminToken();
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export async function adminLogin(pin: string) {
  const data = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  if (!data.ok) throw new Error('Invalid PIN');
  const json = await data.json();
  setAdminToken(json.token);
  return json;
}

export async function adminLogout() {
  try {
    await adminFetch('/logout', { method: 'POST' });
  } finally {
    clearAdminToken();
  }
}

export const adminApi = {
  stats: () => adminFetch('/stats'),
  reports: (status?: string) => adminFetch(`/reports${status ? `?status=${status}` : ''}`),
  reportAction: (id: string, action: 'confirm' | 'dismiss' | 'ban_channel') =>
    adminFetch(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ action }) }),
  messages: (limit = 200, offset = 0) => adminFetch(`/messages?limit=${limit}&offset=${offset}`),
  messageAction: (id: string, action: 'restore' | 'hide' | 'confirm_remove') =>
    adminFetch(`/messages/${id}`, { method: 'PATCH', body: JSON.stringify({ action }) }),
  deleteMessage: (id: string) => adminFetch(`/messages/${id}`, { method: 'DELETE' }),
  channels: () => adminFetch('/channels'),
  banned: () => adminFetch('/banned'),
  banChannel: (threadId: string, reason?: string) =>
    adminFetch('/banned', { method: 'POST', body: JSON.stringify({ threadId, reason }) }),
  unbanChannel: (threadId: string) => adminFetch(`/banned/${encodeURIComponent(threadId)}`, { method: 'DELETE' }),
  simulator: () => adminFetch('/simulator'),
  setSimulator: (enabled: boolean) =>
    adminFetch('/simulator', { method: 'PATCH', body: JSON.stringify({ enabled }) }),
  audit: () => adminFetch('/audit'),
  tiers: () => adminFetch('/tiers'),
  expireBurned: () => adminFetch('/expire-burned', { method: 'POST' }),
};