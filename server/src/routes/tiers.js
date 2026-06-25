import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { TIER_CAPS, FLUX_BURN_OPTIONS, normalizeTier } from '../utils/tiers.js';
import { PAID_TIER_IDS, TIER_PRICES, getTierPrice, uniquePaymentSats, satsToBtc } from '../utils/tierPricing.js';
import { resolveRequestCaps } from '../utils/caps.js';
import { getBtcRates, usdToBtc, brlToBtc, formatBtc } from '../services/rates.js';
import { isBtcpayConfigured, createBtcpayInvoice, getBtcpayInvoiceStatus } from '../services/btcpay.js';
import { findMatchingPayment } from '../services/blockchain.js';
import {
  isStripeConfigured,
  createTierCheckoutSession,
  retrieveCheckoutSession,
  getPublicAppUrl,
} from '../services/stripe.js';
import {
  createSubscription,
  getSubscriptionById,
  getSubscriptionByStripeSessionId,
  markSubscriptionPaid,
  updateSubscription,
} from '../db/subscriptions.js';
import {
  enforceDeviceAccess,
  listDeviceSessions,
  revokeDeviceSession,
  MAX_DEVICES_PER_CODE,
} from '../db/deviceSessions.js';
import { getDeviceId } from '../middleware/deviceAccess.js';

const router = Router();

const invoiceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many payment requests. Wait a moment.' },
});

function bitcoinPaymentsEnabled() {
  return isBtcpayConfigured(config) || Boolean(config.bitcoinTipAddress);
}

function paymentsEnabled() {
  return bitcoinPaymentsEnabled() || isStripeConfigured();
}

function tierCatalog() {
  return PAID_TIER_IDS.map((id) => ({
    id,
    name: TIER_CAPS[id].label,
    priceUsd: TIER_PRICES[id].usd,
    priceBrl: TIER_PRICES[id].brl,
    price: `$${TIER_PRICES[id].usd}/mo`,
    payment: isStripeConfigured() ? 'Bitcoin or card' : 'Bitcoin only',
    tagline:
      id === 'signal'
        ? 'Custom vanity channel IDs'
        : id === 'pulse'
          ? 'Attachments, pinning, priority styling'
          : 'Deep void — maximum anonymity',
    featured: id === 'flux',
    caps: TIER_CAPS[id],
    active: true,
    comingSoon: false,
  }));
}

router.get('/catalog', (_req, res) => {
  res.json({
    launchMode: false,
    paymentMethod: isStripeConfigured() ? 'bitcoin,stripe' : 'bitcoin',
    paymentMethods: {
      bitcoin: bitcoinPaymentsEnabled(),
      stripe: isStripeConfigured(),
    },
    paymentStatus: paymentsEnabled() ? 'live' : 'disabled',
    paymentsEnabled: paymentsEnabled(),
    freeTier: {
      id: 'void',
      name: 'VOID',
      price: 'Free',
      active: true,
      caps: TIER_CAPS.void,
      features: [
        'Random channel IDs',
        'Unlimited public messages',
        'Live signal feed',
        'Emoji group chat',
        'Channel lock',
        'No login required',
      ],
    },
    paidTiers: tierCatalog(),
    fluxHighlight: {
      deepVoid: true,
      burnTimers: FLUX_BURN_OPTIONS.map((o) => o.label),
      anonymity: 'Messages buried mid-feed — not boosted to top',
    },
  });
});

router.get('/me', (req, res) => {
  const resolved = resolveRequestCaps(req);
  res.json({
    tier: resolved.tier,
    caps: resolved.caps,
    accessCode: resolved.accessCode,
    expiresAt: resolved.expiresAt,
    source: resolved.source,
  });
});

router.post('/redeem', (req, res) => {
  const code = req.body?.code;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Access code required' });
  }
  const resolved = resolveRequestCaps({ headers: { 'x-fluxgrid-code': code.trim() }, body: {} });
  if (resolved.source === 'free') {
    return res.status(404).json({ error: 'Invalid or expired access code', code: 'INVALID_CODE' });
  }

  const deviceId = getDeviceId(req);
  const deviceCheck = enforceDeviceAccess(resolved.accessCode, deviceId);
  if (!deviceCheck.ok) {
    return res.status(403).json({
      error: deviceCheck.error,
      code: deviceCheck.code,
      sessions: deviceCheck.sessions ?? [],
      maxDevices: deviceCheck.maxDevices ?? MAX_DEVICES_PER_CODE,
    });
  }

  res.json({
    tier: resolved.tier,
    caps: resolved.caps,
    accessCode: resolved.accessCode,
    expiresAt: resolved.expiresAt,
    label: resolved.caps.label,
    sessions: deviceCheck.sessions ?? [],
    maxDevices: MAX_DEVICES_PER_CODE,
  });
});

router.get('/sessions', (req, res) => {
  const resolved = resolveRequestCaps(req);
  if (!resolved.accessCode) {
    return res.status(400).json({ error: 'No access key on this device' });
  }
  const deviceId = getDeviceId(req);
  res.json({
    accessCode: resolved.accessCode,
    tier: resolved.tier,
    maxDevices: MAX_DEVICES_PER_CODE,
    sessions: listDeviceSessions(resolved.accessCode, deviceId),
  });
});

router.post('/sessions/revoke', (req, res) => {
  const codeFromBody = typeof req.body?.accessCode === 'string' ? req.body.accessCode.trim() : '';
  const resolved = codeFromBody
    ? resolveRequestCaps({ headers: { 'x-fluxgrid-code': codeFromBody }, body: {} })
    : resolveRequestCaps(req);

  if (!resolved.accessCode || resolved.source === 'free') {
    return res.status(400).json({ error: 'Valid access key required to disconnect a device' });
  }

  const deviceId = getDeviceId(req);
  const revokeId = req.body?.deviceId;
  if (!revokeId || typeof revokeId !== 'string') {
    return res.status(400).json({ error: 'deviceId required' });
  }

  const result = revokeDeviceSession(resolved.accessCode, revokeId.trim(), deviceId);
  if (!result.ok) {
    return res.status(403).json({ error: result.error, code: result.code });
  }

  const rejoin = deviceId ? enforceDeviceAccess(resolved.accessCode, deviceId) : { ok: true, sessions: result.sessions };

  res.json({
    ok: true,
    disconnected: revokeId.trim(),
    registered: Boolean(rejoin.ok),
    sessions: rejoin.sessions ?? result.sessions,
    tier: resolved.tier,
    caps: resolved.caps,
    accessCode: resolved.accessCode,
    expiresAt: resolved.expiresAt,
    maxDevices: MAX_DEVICES_PER_CODE,
  });
});

router.get('/config', (_req, res) => {
  const btcpay = isBtcpayConfigured(config);
  res.json({
    enabled: paymentsEnabled(),
    mode: btcpay ? 'btcpay' : config.bitcoinTipAddress ? 'static' : isStripeConfigured() ? 'stripe' : 'disabled',
    paymentMethods: {
      bitcoin: bitcoinPaymentsEnabled(),
      stripe: isStripeConfigured(),
    },
    currencies: ['USD', 'BRL'],
    tiers: tierCatalog(),
    subscriptionDays: 30,
    anonymousAccess:
      'Pay with card or Bitcoin → receive a private access key → stored on your device only. No account, email, or identity.',
    maxDevicesPerKey: MAX_DEVICES_PER_CODE,
  });
});

router.post('/invoice', invoiceLimiter, async (req, res) => {
  if (!bitcoinPaymentsEnabled()) {
    return res.status(503).json({
      error: 'Bitcoin payments not configured',
      code: 'PAYMENTS_DISABLED',
    });
  }

  const tier = normalizeTier(req.body?.tier);
  if (!PAID_TIER_IDS.includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier. Choose signal, pulse, or flux.' });
  }

  const currency = String(req.body?.currency || 'USD').toUpperCase() === 'BRL' ? 'BRL' : 'USD';
  const amount = getTierPrice(tier, currency);
  if (!amount) return res.status(400).json({ error: 'Invalid tier price' });

  const rates = await getBtcRates();
  const baseBtc =
    currency === 'BRL' ? brlToBtc(amount, rates.brl) : usdToBtc(amount, rates.usd);
  if (baseBtc <= 0) {
    return res.status(503).json({ error: 'Could not calculate Bitcoin amount. Try again.' });
  }

  const amountUsd = currency === 'USD' ? amount : (amount / rates.brl) * rates.usd;
  const amountBrl = currency === 'BRL' ? amount : (amount / rates.usd) * rates.brl;

  try {
    const sub = createSubscription({
      tier,
      currency,
      amountUsd: Math.round(amountUsd * 100) / 100,
      amountBrl: Math.round(amountBrl * 100) / 100,
      mode: isBtcpayConfigured(config) ? 'btcpay' : 'static',
    });

    const amountSats = uniquePaymentSats(baseBtc, sub.id);
    const amountBtc = formatBtc(satsToBtc(amountSats));
    updateSubscription(sub.id, { amountBtc, amountSats });

    if (isBtcpayConfigured(config)) {
      const invoice = await createBtcpayInvoice(config, {
        amount,
        currency,
        tipId: sub.id,
        metadata: { subscriptionId: sub.id, tier, type: 'subscription' },
      });
      updateSubscription(sub.id, {
        invoiceId: invoice.invoiceId,
        checkoutUrl: invoice.checkoutUrl,
      });

      return res.status(201).json({
        mode: 'btcpay',
        subscriptionId: sub.id,
        tier,
        tierLabel: TIER_CAPS[tier].label,
        invoiceId: invoice.invoiceId,
        checkoutUrl: invoice.checkoutUrl,
        amountUsd: sub.amountUsd,
        amountBrl: sub.amountBrl,
        amountBtc,
        amountSats,
        currency,
        rates,
        message: 'Send exact BTC amount. Your private access key unlocks instantly when payment confirms.',
      });
    }

    const address = config.bitcoinTipAddress;
    const paymentUri = `bitcoin:${address}?amount=${amountBtc}`;
    updateSubscription(sub.id, { address, paymentUri });

    return res.status(201).json({
      mode: 'static',
      subscriptionId: sub.id,
      tier,
      tierLabel: TIER_CAPS[tier].label,
      address,
      amountBtc,
      amountSats,
      amountUsd: sub.amountUsd,
      amountBrl: sub.amountBrl,
      paymentUri,
      currency,
      rates,
      message: 'Send the EXACT BTC amount shown. Your private access key unlocks automatically when detected.',
    });
  } catch (err) {
    console.error('Tier invoice error:', err);
    return res.status(500).json({ error: 'Could not create payment. Try again.' });
  }
});

router.get('/invoice/:subscriptionId/status', async (req, res) => {
  const sub = getSubscriptionById(req.params.subscriptionId);
  if (!sub) return res.status(404).json({ error: 'Payment not found' });

  if (sub.status === 'paid' && sub.accessCode) {
    return res.json({
      subscriptionId: sub.id,
      status: 'paid',
      paid: true,
      tier: sub.tier,
      tierLabel: TIER_CAPS[sub.tier]?.label,
      accessCode: sub.accessCode,
      expiresAt: sub.expiresAt,
      caps: TIER_CAPS[sub.tier],
    });
  }

  if (sub.mode === 'btcpay' && sub.invoiceId && isBtcpayConfigured(config)) {
    try {
      const status = await getBtcpayInvoiceStatus(config, sub.invoiceId);
      if (status.paid) {
        const paid = markSubscriptionPaid(sub.id);
        return res.json({
          subscriptionId: paid.id,
          status: 'paid',
          paid: true,
          tier: paid.tier,
          tierLabel: TIER_CAPS[paid.tier]?.label,
          accessCode: paid.accessCode,
          expiresAt: paid.expiresAt,
          caps: TIER_CAPS[paid.tier],
        });
      }
    } catch {
      /* fall through */
    }
  }

  if (sub.mode === 'static' && sub.address && sub.amountSats) {
    const match = await findMatchingPayment(sub.address, sub.amountSats, sub.createdAt);
    if (match) {
      const paid = markSubscriptionPaid(sub.id, { txid: match.txid });
      return res.json({
        subscriptionId: paid.id,
        status: 'paid',
        paid: true,
        tier: paid.tier,
        tierLabel: TIER_CAPS[paid.tier]?.label,
        accessCode: paid.accessCode,
        expiresAt: paid.expiresAt,
        caps: TIER_CAPS[paid.tier],
        confirmed: match.confirmed,
      });
    }
  }

  if (sub.mode === 'stripe' && sub.stripeSessionId && isStripeConfigured()) {
    try {
      const session = await retrieveCheckoutSession(sub.stripeSessionId);
      if (session.payment_status === 'paid') {
        const paid = markSubscriptionPaid(sub.id, {
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent?.id || session.payment_intent || null,
          referral: session.metadata?.referral || session.client_reference_id || null,
          affiliateRef: session.metadata?.affiliate_ref || null,
        });
        return res.json({
          subscriptionId: paid.id,
          status: 'paid',
          paid: true,
          tier: paid.tier,
          tierLabel: TIER_CAPS[paid.tier]?.label,
          accessCode: paid.accessCode,
          expiresAt: paid.expiresAt,
          caps: TIER_CAPS[paid.tier],
        });
      }
    } catch {
      /* fall through */
    }
  }

  res.json({
    subscriptionId: sub.id,
    status: sub.status,
    paid: false,
    tier: sub.tier,
    amountBtc: sub.amountBtc,
    mode: sub.mode,
  });
});

router.post('/stripe/checkout', invoiceLimiter, async (req, res) => {
  if (!isStripeConfigured()) {
    return res.status(503).json({
      error: 'Card payments not configured',
      code: 'STRIPE_DISABLED',
    });
  }

  const tier = normalizeTier(req.body?.tier);
  if (!PAID_TIER_IDS.includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier. Choose signal, pulse, or flux.' });
  }

  const currency = String(req.body?.currency || 'USD').toUpperCase() === 'BRL' ? 'BRL' : 'USD';
  const amount = getTierPrice(tier, currency);
  if (!amount) return res.status(400).json({ error: 'Invalid tier price' });

  const rates = await getBtcRates();
  const computedUsd =
    currency === 'USD' ? amount : (amount / rates.brl) * rates.usd;
  const amountBrl = currency === 'BRL' ? amount : (amount / rates.usd) * rates.brl;

  const referral = typeof req.body?.referral === 'string' ? req.body.referral.trim() : '';
  const affiliateRef = typeof req.body?.affiliateRef === 'string' ? req.body.affiliateRef.trim() : '';

  try {
    const sub = createSubscription({
      tier,
      currency,
      amountUsd: Math.round(computedUsd * 100) / 100,
      amountBrl: Math.round(amountBrl * 100) / 100,
      mode: 'stripe',
      referral: referral || null,
      affiliateRef: affiliateRef || null,
    });

    const baseUrl = getPublicAppUrl(req);
    const session = await createTierCheckoutSession({
      subscriptionId: sub.id,
      tier,
      tierLabel: TIER_CAPS[tier].label,
      amountUsd: computedUsd,
      currency: currency === 'BRL' ? 'brl' : 'usd',
      referral: referral || undefined,
      affiliateRef: affiliateRef || undefined,
      successUrl: `${baseUrl}/?stripe_session={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/?stripe_cancel=1`,
    });

    updateSubscription(sub.id, {
      stripeSessionId: session.id,
      checkoutUrl: session.url,
    });

    return res.status(201).json({
      mode: 'stripe',
      subscriptionId: sub.id,
      tier,
      tierLabel: TIER_CAPS[tier].label,
      checkoutUrl: session.url,
      stripeSessionId: session.id,
      amountUsd: sub.amountUsd,
      amountBrl: sub.amountBrl,
      currency,
      message: 'Complete payment on Stripe. Your private access key unlocks instantly when payment confirms.',
    });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: 'Could not create card checkout. Try again.' });
  }
});

router.get('/stripe/complete', async (req, res) => {
  if (!isStripeConfigured()) {
    return res.status(503).json({ error: 'Card payments not configured' });
  }

  const sessionId = String(req.query.session_id || '').trim();
  if (!sessionId) {
    return res.status(400).json({ error: 'session_id required' });
  }

  try {
    let sub = getSubscriptionByStripeSessionId(sessionId);
    const session = await retrieveCheckoutSession(sessionId);

    if (!sub && session.metadata?.subscriptionId) {
      sub = getSubscriptionById(session.metadata.subscriptionId);
    }

    if (!sub) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (session.payment_status === 'paid' && sub.status !== 'paid') {
      sub = markSubscriptionPaid(sub.id, {
        mode: 'stripe',
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent?.id || session.payment_intent || null,
        referral: session.metadata?.referral || session.client_reference_id || null,
        affiliateRef: session.metadata?.affiliate_ref || null,
      });
    }

    if (sub.status === 'paid' && sub.accessCode) {
      return res.json({
        subscriptionId: sub.id,
        status: 'paid',
        paid: true,
        tier: sub.tier,
        tierLabel: TIER_CAPS[sub.tier]?.label,
        accessCode: sub.accessCode,
        expiresAt: sub.expiresAt,
        caps: TIER_CAPS[sub.tier],
      });
    }

    return res.json({
      subscriptionId: sub.id,
      status: sub.status,
      paid: false,
      paymentStatus: session.payment_status,
    });
  } catch (err) {
    console.error('Stripe complete error:', err);
    return res.status(500).json({ error: 'Could not verify payment' });
  }
});

export default router;