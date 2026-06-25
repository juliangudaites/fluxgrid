import { Router } from 'express';
import {
  createSession,
  validatePin,
  requireAdmin,
  revokeSession,
} from '../middleware/adminAuth.js';
import {
  getAllMessagesAdmin,
  getStats,
  getChannelStats,
  getMessageById,
  restoreMessage,
  confirmRemoveMessage,
  removeMessage,
  hideMessage,
} from '../db/store.js';
import {
  getReports,
  getReportById,
  updateReport,
  getReportStats,
} from '../db/reports.js';
import {
  getBannedChannels,
  banChannel,
  unbanChannel,
} from '../db/banned.js';
import { getAuditLogs, logAction } from '../db/audit.js';
import { isSimulatorEnabled, setSimulatorEnabled } from '../simulator.js';
import { config } from '../config.js';
import { isStripeConfigured } from '../services/stripe.js';
import { getSubscriptionsAdmin, markSubscriptionPaid } from '../db/subscriptions.js';
import { expireBurnedMessages } from '../db/store.js';


const router = Router();

router.post('/login', (req, res) => {
  const { pin } = req.body ?? {};
  if (!pin || !validatePin(pin)) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }
  const token = createSession();
  logAction('admin_login', {});
  res.json({ token, expiresInHours: 8 });
});

router.post('/logout', requireAdmin, (req, res) => {
  revokeSession(req.adminToken);
  res.json({ success: true });
});

router.get('/stats', requireAdmin, (_req, res) => {
  res.json({
    messages: getStats(),
    reports: getReportStats(),
    simulator: isSimulatorEnabled(),
  });
});

router.get('/reports', requireAdmin, (req, res) => {
  const status = req.query.status;
  res.json({ reports: getReports(status || undefined) });
});

router.patch('/reports/:id', requireAdmin, (req, res) => {
  const report = getReportById(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  const { action } = req.body ?? {};

  if (action === 'confirm') {
    confirmRemoveMessage(report.messageId);
    const updated = updateReport(report.id, { status: 'confirmed', moderatorAction: 'confirmed_removed' });
    logAction('report_confirmed', { reportId: report.id, messageId: report.messageId });
    return res.json({ report: updated });
  }

  if (action === 'dismiss') {
    restoreMessage(report.messageId);
    const updated = updateReport(report.id, { status: 'dismissed', moderatorAction: 'dismissed_restored' });
    logAction('report_dismissed', { reportId: report.id, messageId: report.messageId });
    return res.json({ report: updated });
  }

  if (action === 'ban_channel') {
    banChannel(report.threadId, `report:${report.category}`);
    confirmRemoveMessage(report.messageId);
    const updated = updateReport(report.id, { status: 'confirmed', moderatorAction: 'channel_banned' });
    logAction('channel_banned', { threadId: report.threadId, reportId: report.id });
    return res.json({ report: updated });
  }

  return res.status(400).json({ error: 'Invalid action' });
});

router.get('/messages', requireAdmin, (req, res) => {
  const limit = Number(req.query.limit) || 200;
  const offset = Number(req.query.offset) || 0;
  res.json(getAllMessagesAdmin(limit, offset));
});

router.get('/messages/:id', requireAdmin, (req, res) => {
  const msg = getMessageById(req.params.id);
  if (!msg) return res.status(404).json({ error: 'Not found' });
  res.json({ message: msg });
});

router.patch('/messages/:id', requireAdmin, (req, res) => {
  const { action } = req.body ?? {};
  const id = req.params.id;

  if (action === 'restore') {
    const msg = restoreMessage(id);
    if (!msg) return res.status(404).json({ error: 'Not found' });
    logAction('message_restored', { messageId: id });
    return res.json({ message: msg });
  }

  if (action === 'hide') {
    const msg = hideMessage(id, 'admin');
    if (!msg) return res.status(404).json({ error: 'Not found' });
    logAction('message_hidden', { messageId: id });
    return res.json({ message: msg });
  }

  if (action === 'confirm_remove') {
    const msg = confirmRemoveMessage(id);
    if (!msg) return res.status(404).json({ error: 'Not found' });
    logAction('message_removed', { messageId: id });
    return res.json({ message: msg });
  }

  return res.status(400).json({ error: 'Invalid action' });
});

router.delete('/messages/:id', requireAdmin, (req, res) => {
  const deleted = removeMessage(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  logAction('message_deleted_permanent', { messageId: req.params.id });
  res.json({ success: true });
});

router.get('/channels', requireAdmin, (_req, res) => {
  res.json({ channels: getChannelStats() });
});

router.get('/banned', requireAdmin, (_req, res) => {
  res.json({ channels: getBannedChannels() });
});

router.post('/banned', requireAdmin, (req, res) => {
  const { threadId, reason } = req.body ?? {};
  if (!threadId) return res.status(400).json({ error: 'threadId required' });
  banChannel(threadId.trim().toUpperCase(), reason || 'admin');
  logAction('channel_banned', { threadId });
  res.json({ success: true });
});

router.delete('/banned/:threadId', requireAdmin, (req, res) => {
  const ok = unbanChannel(req.params.threadId);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  logAction('channel_unbanned', { threadId: req.params.threadId });
  res.json({ success: true });
});

router.get('/simulator', requireAdmin, (_req, res) => {
  res.json({ enabled: isSimulatorEnabled() });
});

router.patch('/simulator', requireAdmin, (req, res) => {
  const { enabled } = req.body ?? {};
  const state = setSimulatorEnabled(enabled);
  logAction('simulator_toggle', { enabled: state });
  res.json({ enabled: state });
});

router.get('/audit', requireAdmin, (req, res) => {
  const limit = Number(req.query.limit) || 100;
  res.json({ logs: getAuditLogs(limit) });
});

router.get('/tiers', requireAdmin, (_req, res) => {
  const stripe = isStripeConfigured();
  const bitcoin = Boolean(config.bitcoinTipAddress);
  res.json({
    launchMode: false,
    paymentsEnabled: bitcoin || stripe,
    paymentMethods: { bitcoin, stripe },
    message: stripe && bitcoin
      ? 'Paid tiers live — Card (Stripe) + Bitcoin. Access keys on payment.'
      : stripe
        ? 'Paid tiers live — Card (Stripe) only.'
        : bitcoin
          ? 'Paid tiers live — Bitcoin only. Add STRIPE_SECRET_KEY for card.'
          : 'No payments configured.',
  });
});

router.get('/subscriptions', requireAdmin, (req, res) => {
  const limit = Number(req.query.limit) || 50;
  res.json({ subscriptions: getSubscriptionsAdmin(limit) });
});

router.post('/subscriptions/:id/confirm', requireAdmin, (req, res) => {
  const paid = markSubscriptionPaid(req.params.id);
  if (!paid) return res.status(404).json({ error: 'Subscription not found' });
  logAction('subscription_confirm_manual', { id: paid.id, tier: paid.tier, accessCode: paid.accessCode });
  res.json({
    ok: true,
    subscriptionId: paid.id,
    tier: paid.tier,
    accessCode: paid.accessCode,
    expiresAt: paid.expiresAt,
    status: paid.status,
  });
});

router.post('/expire-burned', requireAdmin, (_req, res) => {
  const count = expireBurnedMessages();
  logAction('burner_expire_manual', { count });
  res.json({ expired: count });
});

export default router;