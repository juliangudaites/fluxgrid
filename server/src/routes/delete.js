import { Router } from 'express';
import { deleteMessageByToken } from '../db/store.js';

const router = Router();

router.post('/', (req, res) => {
  const { messageId, deleteToken } = req.body ?? {};
  if (!messageId || !deleteToken) {
    return res.status(400).json({ error: 'messageId and deleteToken required' });
  }
  const deleted = deleteMessageByToken(messageId, deleteToken);
  if (!deleted) {
    return res.status(404).json({ error: 'Message not found or invalid token' });
  }
  res.json({ success: true });
});

export default router;