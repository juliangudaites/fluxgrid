import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { getBtcRates, usdToBtc, brlToBtc, formatBtc } from '../services/rates.js';
import {
  isBtcpayConfigured,
  createBtcpayInvoice,
  getBtcpayInvoiceStatus,
} from '../services/btcpay.js';
import { createTipRecord, getTipById, updateTipStatus } from '../db/tips.js';

const router = Router();

const tipLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: 'Too many tip requests. Wait a moment.' },
});

function tipsEnabled() {
  return isBtcpayConfigured(config) || Boolean(config.bitcoinTipAddress);
}

function resolveAmount(body) {
  const amountUsd = Number(body?.amountUsd);
  const amountBrl = Number(body?.amountBrl);
  if (amountUsd >= 1 && amountUsd <= 5000) {
    return { amount: amountUsd, currency: 'USD' };
  }
  if (amountBrl >= 5 && amountBrl <= 25000) {
    return { amount: amountBrl, currency: 'BRL' };
  }
  return null;
}

router.get('/config', (_req, res) => {
  const btcpay = isBtcpayConfigured(config);
  res.json({
    enabled: tipsEnabled(),
    mode: btcpay ? 'btcpay' : config.bitcoinTipAddress ? 'static' : 'disabled',
    hasAddress: Boolean(config.bitcoinTipAddress),
    btcpay,
    currencies: ['USD', 'BRL'],
    minUsd: 1,
    maxUsd: 5000,
    minBrl: 5,
    maxBrl: 25000,
    presetUsd: [3, 7, 15, 25],
  });
});

router.get('/rates', async (_req, res) => {
  const rates = await getBtcRates();
  res.json(rates);
});

router.post('/invoice', tipLimiter, async (req, res) => {
  if (!tipsEnabled()) {
    return res.status(503).json({
      error: 'Bitcoin tips not configured. Set BITCOIN_TIP_ADDRESS or BTCPay credentials in server .env',
      code: 'TIPS_NOT_CONFIGURED',
    });
  }

  const parsed = resolveAmount(req.body);
  if (!parsed) {
    return res.status(400).json({
      error: 'Enter a valid tip: $1–$5000 USD or R$5–R$25,000 BRL',
    });
  }

  const rates = await getBtcRates();
  const btcAmount =
    parsed.currency === 'BRL'
      ? brlToBtc(parsed.amount, rates.brl)
      : usdToBtc(parsed.amount, rates.usd);

  if (btcAmount <= 0) {
    return res.status(503).json({ error: 'Could not calculate Bitcoin amount. Try again.' });
  }

  const amountBtc = formatBtc(btcAmount);
  const amountUsd =
    parsed.currency === 'USD' ? parsed.amount : (parsed.amount / rates.brl) * rates.usd;
  const amountBrl =
    parsed.currency === 'BRL' ? parsed.amount : (parsed.amount / rates.usd) * rates.brl;

  try {
    if (isBtcpayConfigured(config)) {
      const tip = createTipRecord({
        mode: 'btcpay',
        amountUsd: Math.round(amountUsd * 100) / 100,
        amountBrl: Math.round(amountBrl * 100) / 100,
        amountBtc,
        currency: parsed.currency,
      });

      const invoice = await createBtcpayInvoice(config, {
        amount: parsed.amount,
        currency: parsed.currency,
        tipId: tip.id,
      });

      updateTipStatus(tip.id, 'pending', {
        invoiceId: invoice.invoiceId,
        checkoutUrl: invoice.checkoutUrl,
      });

      return res.status(201).json({
        mode: 'btcpay',
        tipId: tip.id,
        invoiceId: invoice.invoiceId,
        checkoutUrl: invoice.checkoutUrl,
        amountUsd: Math.round(amountUsd * 100) / 100,
        amountBrl: Math.round(amountBrl * 100) / 100,
        amountBtc,
        currency: parsed.currency,
        rates,
      });
    }

    const address = config.bitcoinTipAddress;
    const paymentUri = `bitcoin:${address}?amount=${amountBtc}`;
    const tip = createTipRecord({
      mode: 'static',
      address,
      amountUsd: Math.round(amountUsd * 100) / 100,
      amountBrl: Math.round(amountBrl * 100) / 100,
      amountBtc,
      paymentUri,
      currency: parsed.currency,
    });

    return res.status(201).json({
      mode: 'static',
      tipId: tip.id,
      address,
      amountBtc,
      amountUsd: Math.round(amountUsd * 100) / 100,
      amountBrl: Math.round(amountBrl * 100) / 100,
      paymentUri,
      currency: parsed.currency,
      rates,
    });
  } catch (err) {
    console.error('Tip invoice error:', err);
    return res.status(500).json({ error: 'Could not create Bitcoin payment. Try again.' });
  }
});

router.get('/invoice/:tipId/status', async (req, res) => {
  const tip = getTipById(req.params.tipId);
  if (!tip) return res.status(404).json({ error: 'Tip not found' });

  if (tip.mode === 'btcpay' && tip.invoiceId && isBtcpayConfigured(config)) {
    try {
      const status = await getBtcpayInvoiceStatus(config, tip.invoiceId);
      if (status.paid && tip.status !== 'paid') {
        updateTipStatus(tip.id, 'paid');
      }
      return res.json({ tipId: tip.id, status: status.paid ? 'paid' : tip.status, paid: status.paid });
    } catch {
      return res.json({ tipId: tip.id, status: tip.status, paid: false });
    }
  }

  res.json({
    tipId: tip.id,
    status: tip.status,
    paid: tip.status === 'paid',
    mode: tip.mode,
    note: tip.mode === 'static' ? 'Send exact BTC amount, then tip is recorded manually or via wallet notification' : undefined,
  });
});

export default router;