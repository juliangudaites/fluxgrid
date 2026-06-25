import { getActiveCaps } from './freeCaps.js';
import { getTierCaps, normalizeTier } from './tiers.js';
import { getActiveSubscriptionByCode } from '../db/subscriptions.js';

export function resolveRequestCaps(req) {
  const codeHeader = req.headers['x-fluxgrid-code'];
  const codeBody = req.body?.accessCode;
  const code = (codeHeader || codeBody || '').toString().trim();

  if (code) {
    const sub = getActiveSubscriptionByCode(code.toUpperCase());
    if (sub) {
      const tier = normalizeTier(sub.tier);
      return {
        tier,
        caps: getTierCaps(tier),
        accessCode: sub.accessCode,
        expiresAt: sub.expiresAt,
        source: 'subscription',
      };
    }
  }

  return {
    tier: 'void',
    caps: getActiveCaps(),
    accessCode: null,
    expiresAt: null,
    source: 'free',
  };
}