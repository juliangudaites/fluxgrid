import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createReport } from '../db/reports.js';

const router = Router();

const VALID_CATEGORIES = new Set([
  'csam',
  'grooming',
  'threat',
  'illegal',
  'harassment',
  'spam',
]);

const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many reports. Try again later.' },
});

router.post('/', reportLimiter, (req, res) => {
  const { messageId, threadId, category } = req.body ?? {};

  if (!messageId || typeof messageId !== 'string') {
    return res.status(400).json({ error: 'messageId required' });
  }
  if (!threadId || typeof threadId !== 'string') {
    return res.status(400).json({ error: 'threadId required' });
  }
  if (!VALID_CATEGORIES.has(category)) {
    return res.status(400).json({ error: 'Invalid report category' });
  }

  const report = createReport({
    messageId: messageId.trim(),
    threadId: threadId.trim().toUpperCase(),
    category,
  });

  res.status(201).json({
    report: {
      id: report.id,
      status: report.status,
      action: report.action,
    },
  });
});

export default router;