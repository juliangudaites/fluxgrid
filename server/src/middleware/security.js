import rateLimit from 'express-rate-limit';

/** Global API rate limit — prevents brute-force and flooding. */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Slow down.' },
});

/** Stricter limit for write endpoints beyond per-route limits. */
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many write requests. Try again shortly.' },
});

const recentHashes = new Map();
const HASH_WINDOW_MS = 30_000;
const MAX_HASH_ENTRIES = 5000;

function contentHash(threadId, content, emoji) {
  return `${threadId}|${emoji}|${content.trim().toLowerCase()}`;
}

/** Block identical spam bursts within a short window. */
export function antiSpam(req, res, next) {
  const { threadId, content, senderEmoji } = req.body ?? {};
  if (!threadId || !content || !senderEmoji) return next();

  const hash = contentHash(
    String(threadId).trim().toUpperCase(),
    String(content),
    String(senderEmoji)
  );
  const now = Date.now();
  const last = recentHashes.get(hash);

  if (last && now - last < HASH_WINDOW_MS) {
    return res.status(429).json({ error: 'Duplicate message detected. Wait a moment.' });
  }

  recentHashes.set(hash, now);

  if (recentHashes.size > MAX_HASH_ENTRIES) {
    for (const [key, ts] of recentHashes) {
      if (now - ts > HASH_WINDOW_MS) recentHashes.delete(key);
    }
  }

  next();
}