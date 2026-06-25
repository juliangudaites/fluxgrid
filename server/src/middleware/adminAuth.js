import { timingSafeEqual, randomUUID } from 'crypto';
import { config } from '../config.js';

const sessions = new Map();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function safeCompare(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createSession() {
  const token = randomUUID();
  sessions.set(token, { createdAt: Date.now() });
  return token;
}

export function validatePin(pin) {
  return safeCompare(String(pin), config.adminPin);
}

export function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.slice(7);
  const session = sessions.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Session expired' });
  }
  req.adminToken = token;
  next();
}

export function revokeSession(token) {
  sessions.delete(token);
}