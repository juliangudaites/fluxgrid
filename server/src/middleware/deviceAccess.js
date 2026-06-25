import { enforceDeviceAccess } from '../db/deviceSessions.js';

export function getDeviceId(req) {
  const raw = req.headers['x-fluxgrid-device'];
  if (!raw || typeof raw !== 'string') return null;
  const id = raw.trim();
  if (!/^[a-f0-9-]{16,64}$/i.test(id)) return null;
  return id;
}

export function requireDeviceAccess(accessCode) {
  return (req, res, next) => {
    if (!accessCode) return next();

    const deviceId = getDeviceId(req);
    const result = enforceDeviceAccess(accessCode, deviceId);
    if (!result.ok) {
      return res.status(403).json({
        error: result.error,
        code: result.code,
        sessions: result.sessions ?? [],
        maxDevices: result.maxDevices,
      });
    }
    req.deviceSessions = result.sessions;
    next();
  };
}