import { createHash } from 'crypto';

export const TIER_PRICES = {
  signal: { usd: 6, brl: 35 },
  pulse: { usd: 11, brl: 65 },
  flux: { usd: 18, brl: 105 },
};

export const PAID_TIER_IDS = ['signal', 'pulse', 'flux'];

export function getTierPrice(tier, currency = 'USD') {
  const prices = TIER_PRICES[tier];
  if (!prices) return null;
  return currency.toUpperCase() === 'BRL' ? prices.brl : prices.usd;
}

/** Unique satoshi suffix so same wallet can distinguish concurrent invoices. */
export function uniquePaymentSats(baseBtc, invoiceId) {
  const baseSats = Math.round(baseBtc * 1e8);
  const hash = createHash('sha256').update(String(invoiceId)).digest();
  const suffix = 100 + (hash.readUInt16BE(0) % 900);
  return baseSats + suffix;
}

export function satsToBtc(sats) {
  return sats / 1e8;
}