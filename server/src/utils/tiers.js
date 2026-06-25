export const TIER_IDS = ['void', 'signal', 'pulse', 'flux'];

export const FLUX_BURN_OPTIONS = [
  { label: '30 seconds', seconds: 30 },
  { label: '60 seconds', seconds: 60 },
  { label: '12 hours', seconds: 12 * 60 * 60 },
  { label: '24 hours', seconds: 24 * 60 * 60 },
  { label: '48 hours', seconds: 48 * 60 * 60 },
];

export const TIER_CAPS = {
  void: {
    label: 'VOID',
    vanityIds: false,
    maxContent: 2000,
    burner: false,
    burnOptions: [],
    maxBurnSeconds: 0,
    boosted: false,
    attachments: false,
    pinMessages: false,
    priorityStyle: false,
    maxImageBytes: 0,
    maxVideoBytes: 0,
  },
  signal: {
    label: 'SIGNAL',
    vanityIds: true,
    maxContent: 2000,
    burner: false,
    burnOptions: [],
    maxBurnSeconds: 0,
    boosted: false,
    attachments: false,
    pinMessages: false,
    priorityStyle: false,
    maxImageBytes: 0,
    maxVideoBytes: 0,
  },
  pulse: {
    label: 'PULSE',
    vanityIds: true,
    maxContent: 5000,
    burner: false,
    burnOptions: [],
    maxBurnSeconds: 0,
    boosted: false,
    attachments: true,
    pinMessages: true,
    priorityStyle: true,
    maxImageBytes: 1_500_000,
    maxVideoBytes: 4_000_000,
  },
  flux: {
    label: 'FLUX',
    vanityIds: true,
    maxContent: 5000,
    burner: true,
    burnOptions: FLUX_BURN_OPTIONS.map((o) => o.seconds),
    maxBurnSeconds: 48 * 60 * 60,
    boosted: false,
    deepVoid: true,
    attachments: true,
    pinMessages: true,
    priorityStyle: true,
    maxImageBytes: 1_500_000,
    maxVideoBytes: 4_000_000,
    payment: 'bitcoin',
  },
};

export function normalizeTier(value) {
  const tier = String(value || 'void').toLowerCase();
  return TIER_CAPS[tier] ? tier : 'void';
}

/** Paid subscription codes only — no test or demo codes. */
export function redeemCode() {
  return null;
}

export function resolveRequestTier(req) {
  const fromHeader = req.headers['x-fluxgrid-tier'];
  const fromBody = req.body?.tier;
  return normalizeTier(fromBody || fromHeader || 'void');
}

export function getTierCaps(tier) {
  return TIER_CAPS[normalizeTier(tier)];
}

export function isAllowedBurnSeconds(tier, seconds) {
  const caps = getTierCaps(tier);
  if (!caps.burner) return false;
  return caps.burnOptions.includes(Math.floor(seconds));
}

export function listTestCodes() {
  return [];
}