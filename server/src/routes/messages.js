import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createMessage,
  getAllMessages,
  getLiveMessages,
  getFeed,
  getThreadMessages,
  pinMessage,
} from '../models/message.js';
import {
  canPostToThread,
  registerParticipant,
  pinThreadMessage,
  setThreadPriority,
  getThreadMeta,
} from '../db/threads.js';
import { validateMessage } from '../middleware/validate.js';
import { requireDeviceAccess, getDeviceId } from '../middleware/deviceAccess.js';
import { resolveRequestCaps } from '../utils/caps.js';
import { antiSpam } from '../middleware/security.js';
import { sanitizeThreadId } from '../utils/sanitize.js';
import { markUserThread } from '../simulator.js';

const router = Router();

const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded', retryAfter: 60 },
});

router.get('/', (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  res.json(getAllMessages(limit, offset));
});

router.post('/', postLimiter, antiSpam, (req, res, next) => {
  const { accessCode } = resolveRequestCaps(req);
  requireDeviceAccess(accessCode)(req, res, next);
}, validateMessage, (req, res) => {
  const {
    threadId,
    content,
    senderEmoji,
    tier,
    attachment,
    pinMessage: shouldPin,
    priorityStyle,
    burnSeconds,
    deepVoid,
  } = req.validated;

  const access = canPostToThread(threadId, senderEmoji);
  if (!access.allowed) {
    return res.status(403).json({ error: access.reason || 'Cannot post to this channel' });
  }

  try {
    markUserThread(threadId);
    const options = { boosted: false, tier };

    if (burnSeconds > 0) {
      options.burnAt = new Date(Date.now() + burnSeconds * 1000).toISOString();
    }
    if (attachment) {
      options.attachmentType = attachment.attachmentType;
      options.attachmentUrl = attachment.attachmentUrl;
    }
    if (priorityStyle) {
      options.priorityStyle = true;
    }
    if (shouldPin) {
      options.pinned = true;
    }
    if (deepVoid) {
      options.deepVoid = true;
      const buryMinutes = 8 + Math.floor(Math.random() * 52);
      options.timestamp = new Date(Date.now() - buryMinutes * 60 * 1000).toISOString();
    }

    const message = createMessage(threadId, content, senderEmoji, options);
    registerParticipant(threadId, senderEmoji);

    if (shouldPin) {
      pinMessage(message.id);
      pinThreadMessage(threadId, message.id);
    }
    if (priorityStyle) {
      setThreadPriority(threadId, true);
    }

    res.status(201).json({
      message,
      threadMeta: getThreadMeta(threadId),
    });
  } catch (err) {
    if (err.message === 'Channel is banned') {
      return res.status(403).json({ error: 'This channel is banned' });
    }
    throw err;
  }
});

router.get('/live', (req, res) => {
  const since = typeof req.query.since === 'string' ? req.query.since : '';
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 40);
  res.json(getLiveMessages(since, limit));
});

router.get('/feed', (req, res) => {
  const mode = ['recent', 'random', 'mixed'].includes(req.query.mode)
    ? req.query.mode
    : 'mixed';
  const limit = Number(req.query.limit) || 30;
  const preview = Number(req.query.preview) || 120;
  res.json(getFeed(mode, limit, preview));
});

router.get('/thread/:threadId', (req, res) => {
  const threadId = sanitizeThreadId(req.params.threadId);
  if (!threadId) {
    return res.status(400).json({ error: 'Invalid thread ID' });
  }
  const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 500);
  res.json(getThreadMessages(threadId, limit));
});

export default router;