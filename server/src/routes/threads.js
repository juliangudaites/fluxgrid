import { Router } from 'express';
import {
  getThreadMeta,
  lockThread,
  unlockThread,
} from '../db/threads.js';
import { sanitizeThreadId } from '../utils/sanitize.js';
import { sanitizeSenderEmoji } from '../utils/emojis.js';

const router = Router();

router.get('/:threadId', (req, res) => {
  const threadId = sanitizeThreadId(req.params.threadId);
  if (!threadId) {
    return res.status(400).json({ error: 'Invalid thread ID' });
  }
  res.json(getThreadMeta(threadId));
});

router.post('/:threadId/lock', (req, res) => {
  const threadId = sanitizeThreadId(req.params.threadId);
  if (!threadId) {
    return res.status(400).json({ error: 'Invalid thread ID' });
  }
  const senderEmoji = sanitizeSenderEmoji(req.body?.senderEmoji);
  if (!senderEmoji) {
    return res.status(400).json({ error: 'Valid emoji required to lock channel' });
  }
  try {
    const meta = lockThread(threadId, senderEmoji);
    res.json(meta);
  } catch (err) {
    if (err.message.includes('participants')) {
      return res.status(403).json({ error: err.message });
    }
    throw err;
  }
});

router.post('/:threadId/unlock', (req, res) => {
  const threadId = sanitizeThreadId(req.params.threadId);
  if (!threadId) {
    return res.status(400).json({ error: 'Invalid thread ID' });
  }
  const senderEmoji = sanitizeSenderEmoji(req.body?.senderEmoji);
  if (!senderEmoji) {
    return res.status(400).json({ error: 'Valid emoji required to unlock channel' });
  }
  try {
    const meta = unlockThread(threadId, senderEmoji);
    res.json(meta);
  } catch (err) {
    if (err.message.includes('participants')) {
      return res.status(403).json({ error: err.message });
    }
    throw err;
  }
});

export default router;