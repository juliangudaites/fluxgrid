const DEVICE_KEY = 'fluxgrid_device_id';

function generateDeviceId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `fg-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}

export function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing && /^[a-f0-9-]{16,64}$/i.test(existing)) return existing;
    const id = generateDeviceId();
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return generateDeviceId();
  }
}