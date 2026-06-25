import { createJsonFileStore } from './jsonFile.js';

const sessionsPath = process.env.DEVICE_SESSIONS_PATH || './data/deviceSessions.json';
const file = createJsonFileStore(sessionsPath, { byCode: {} });

export const MAX_DEVICES_PER_CODE = 2;

function readStore() {
  return file.read();
}

function writeStore(data) {
  file.write(data);
}

function getCodeBucket(store, accessCode) {
  const key = String(accessCode).trim().toUpperCase();
  if (!store.byCode[key]) {
    store.byCode[key] = { devices: [] };
  }
  return store.byCode[key];
}

function deviceLabel(index, createdAt) {
  const date = new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `Device ${index + 1} · ${date}`;
}

export function listDeviceSessions(accessCode, currentDeviceId = null) {
  const store = readStore();
  const bucket = getCodeBucket(store, accessCode);
  const sessions = bucket.devices.map((d, i) => ({
    deviceId: d.id,
    label: d.label || deviceLabel(i, d.createdAt),
    lastSeen: d.lastSeen,
    createdAt: d.createdAt,
    isCurrent: Boolean(currentDeviceId && d.id === currentDeviceId),
    waiting: false,
  }));

  if (currentDeviceId && !bucket.devices.some((d) => d.id === currentDeviceId)) {
    sessions.push({
      deviceId: currentDeviceId,
      label: 'This device',
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isCurrent: true,
      waiting: true,
    });
  }

  return sessions;
}

export function clearDeviceSessions(accessCode) {
  const store = readStore();
  const key = String(accessCode).trim().toUpperCase();
  if (store.byCode[key]) {
    store.byCode[key].devices = [];
    writeStore(store);
    return true;
  }
  return false;
}

export function clearAllDeviceSessions() {
  const store = readStore();
  store.byCode = {};
  writeStore(store);
}

export function registerDeviceSession(accessCode, deviceId) {
  if (!accessCode || !deviceId) {
    return { ok: false, code: 'DEVICE_REQUIRED', error: 'Device id required for tier access' };
  }

  const store = readStore();
  const bucket = getCodeBucket(store, accessCode);
  const now = new Date().toISOString();
  const existing = bucket.devices.find((d) => d.id === deviceId);

  if (existing) {
    existing.lastSeen = now;
    writeStore(store);
    return { ok: true, sessions: listDeviceSessions(accessCode, deviceId) };
  }

  if (bucket.devices.length >= MAX_DEVICES_PER_CODE) {
    return {
      ok: false,
      code: 'DEVICE_LIMIT',
      error: `This access key is active on ${MAX_DEVICES_PER_CODE} devices. End another session to use this device.`,
      sessions: listDeviceSessions(accessCode, deviceId),
      maxDevices: MAX_DEVICES_PER_CODE,
    };
  }

  bucket.devices.push({
    id: deviceId,
    createdAt: now,
    lastSeen: now,
    label: deviceLabel(bucket.devices.length, now),
  });
  writeStore(store);
  return { ok: true, sessions: listDeviceSessions(accessCode, deviceId) };
}

export function touchDeviceSession(accessCode, deviceId) {
  if (!accessCode || !deviceId) return { ok: true };
  const store = readStore();
  const bucket = getCodeBucket(store, accessCode);
  const device = bucket.devices.find((d) => d.id === deviceId);
  if (!device) {
    return registerDeviceSession(accessCode, deviceId);
  }
  device.lastSeen = new Date().toISOString();
  writeStore(store);
  return { ok: true };
}

export function revokeDeviceSession(accessCode, deviceIdToRevoke, requesterDeviceId) {
  if (!accessCode || !deviceIdToRevoke) {
    return { ok: false, error: 'Invalid revoke request' };
  }

  const store = readStore();
  const bucket = getCodeBucket(store, accessCode);
  const target = bucket.devices.find((d) => d.id === deviceIdToRevoke);
  if (!target) {
    return { ok: false, error: 'Session not found' };
  }

  bucket.devices = bucket.devices.filter((d) => d.id !== deviceIdToRevoke);
  writeStore(store);

  return {
    ok: true,
    sessions: listDeviceSessions(accessCode, requesterDeviceId || null),
    revoked: deviceIdToRevoke,
  };
}

export function enforceDeviceAccess(accessCode, deviceId) {
  if (!accessCode) return { ok: true };
  if (!deviceId) {
    return {
      ok: false,
      code: 'DEVICE_REQUIRED',
      error: 'Device id required. Refresh the page and try again.',
    };
  }

  const store = readStore();
  const bucket = getCodeBucket(store, accessCode);
  const known = bucket.devices.find((d) => d.id === deviceId);

  if (known) {
    known.lastSeen = new Date().toISOString();
    writeStore(store);
    return { ok: true, sessions: listDeviceSessions(accessCode, deviceId) };
  }

  if (bucket.devices.length >= MAX_DEVICES_PER_CODE) {
    return {
      ok: false,
      code: 'DEVICE_LIMIT',
      error: `This access key is active on ${MAX_DEVICES_PER_CODE} devices. End another session to use this device.`,
      sessions: listDeviceSessions(accessCode, deviceId),
      maxDevices: MAX_DEVICES_PER_CODE,
    };
  }

  return registerDeviceSession(accessCode, deviceId);
}