import { useState } from 'react';
import { useTier } from '../tiers/context';
import type { TierId } from '../tiers/tiers';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import './PlansPanel.css';

interface PlansPanelProps {
  open: boolean;
  onClose: () => void;
  onDonate?: (amountUsd?: number) => void;
  onBuyTier?: (tierId: TierId, priceUsd: number, tierName: string) => void;
}

const freeTier = {
  name: 'VOID',
  price: 'Free',
  period: 'forever',
  tagline: 'Fully operational — launch edition',
  features: [
    'Random channel IDs',
    'Unlimited public messages',
    'Live signal feed',
    'Emoji group chat',
    'Channel lock',
    'No login required',
  ],
};

const paidTiers = [
  {
    id: 'signal' as TierId,
    name: 'SIGNAL',
    priceUsd: 6,
    price: '$6',
    period: '/ month',
    tagline: 'Vanity channel IDs',
    features: [
      'Reserve a custom ID (LOVE, NYC, VOID-7)',
      'Memorable codes for real-life sharing',
      'Anonymous access key — no account',
      'Paid via card or Bitcoin',
    ],
  },
  {
    id: 'pulse' as TierId,
    name: 'PULSE',
    priceUsd: 11,
    price: '$11',
    period: '/ month',
    tagline: 'Channel perks',
    features: [
      'Everything in SIGNAL',
      'Pin messages in your channel',
      '5,000 character limit',
      'Image & video attachments',
      'Priority channel styling',
    ],
  },
  {
    id: 'flux' as TierId,
    name: 'FLUX',
    priceUsd: 18,
    price: '$18',
    period: '/ month',
    tagline: 'Deep void — maximum anonymity',
    featured: true,
    features: [
      'Everything in PULSE',
      'Deep Void — buried mid-feed, not top',
      'Burn timers: 30s to 48h',
      'Maximum anonymity in the void',
    ],
  },
];

const donationAmounts = [3, 7, 15, 25];

export function PlansPanel({ open, onClose, onDonate, onBuyTier }: PlansPanelProps) {
  const {
    tier,
    caps,
    accessCode,
    expiresAt,
    sessions,
    maxDevices,
    applyAccessCode,
    clearAccess,
    revokeSession,
  } = useTier();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [selectedDonation, setSelectedDonation] = useState(7);
  const [customAmount, setCustomAmount] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const paymentMethods = usePaymentMethods(open);

  if (!open) return null;

  const paidSectionTitle = paymentMethods.stripe
    ? 'Paid tiers — Card, Apple Pay, or Bitcoin'
    : 'Paid tiers — Card or Bitcoin';
  const paymentBadge = paymentMethods.stripe
    ? '💳 Card · Apple Pay · ₿ Bitcoin'
    : '💳 Card · ₿ Bitcoin';

  const tipAmount = customAmount ? Number(customAmount) : selectedDonation;
  const validTip = tipAmount >= 1 && tipAmount <= 5000;

  const handleApplyCode = async () => {
    if (!codeInput.trim()) return;
    setCodeLoading(true);
    setCodeError('');
    try {
      await applyAccessCode(codeInput.trim());
      setCodeInput('');
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setCodeLoading(false);
    }
  };

  return (
    <div className="plans-overlay" onClick={onClose}>
      <div className="plans-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="plans-title">
        <header className="plans-panel__header">
          <div>
            <span className="plans-panel__eyebrow">LIVE · 2026 · CARD + ₿ BITCOIN TIERS</span>
            <h2 id="plans-title" className="plans-panel__title">ANONYMOUS PAID TIERS</h2>
            <p className="plans-panel__subtitle">
              Pay with <strong>card or Bitcoin</strong> → get a private <strong>access key</strong> → features unlock instantly.
              Each key works on <strong>{maxDevices} devices max</strong> — still no account or identity.
            </p>
          </div>
          <button type="button" className="plans-panel__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <section className="plans-panel__access">
          <h3 className="plans-panel__section-title">Your access</h3>
          <div className="access-card">
            <div className="access-card__row">
              <span className="access-card__label">Active tier</span>
              <strong className="access-card__tier">{caps.label}</strong>
            </div>
            {accessCode ? (
              <>
                <div className="access-card__row">
                  <span className="access-card__label">Access key</span>
                  <code className="access-card__code">{accessCode}</code>
                </div>
                {expiresAt && (
                  <p className="access-card__expires">
                    Valid until {new Date(expiresAt).toLocaleDateString()}
                  </p>
                )}
                {sessions.filter((s) => !s.waiting).length > 0 && (
                  <div className="access-card__sessions">
                    <span className="access-card__label">
                      Linked devices ({sessions.filter((s) => !s.waiting).length}/{maxDevices})
                    </span>
                    <ul className="access-card__session-list">
                      {sessions.map((s) => (
                        <li key={s.deviceId} className="access-card__session-item">
                          <span>
                            {s.label}
                            {s.isCurrent && !s.waiting ? ' · this device' : ''}
                            {s.waiting ? ' · waiting' : ''}
                          </span>
                          {!s.waiting && !s.isCurrent && (
                            <button
                              type="button"
                              className="access-card__disconnect"
                              disabled={disconnecting === s.deviceId}
                              onClick={async () => {
                                setDisconnecting(s.deviceId);
                                try {
                                  await revokeSession(s.deviceId);
                                } finally {
                                  setDisconnecting(null);
                                }
                              }}
                            >
                              {disconnecting === s.deviceId ? '…' : 'DISCONNECT'}
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <button type="button" className="access-card__clear" onClick={clearAccess}>
                  Use free tier on this device
                </button>
              </>
            ) : (
              <p className="access-card__free">Free VOID tier — pay Bitcoin below to upgrade anonymously.</p>
            )}
            <div className="access-card__redeem">
              <label>
                <span>Enter your access key (from Bitcoin payment or another device)</span>
                <p className="access-card__redeem-warn">
                  No account exists — this key is your only credential. Lose it and you lose your tier permanently.
                  Max {maxDevices} devices — disconnect old sessions above if you hit the limit.
                </p>
                <div className="access-card__redeem-row">
                  <input
                    type="text"
                    placeholder="FG-SIGN-XXXX-XXXX-XXXX"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    spellCheck={false}
                  />
                  <button type="button" onClick={handleApplyCode} disabled={codeLoading}>
                    {codeLoading ? '…' : 'APPLY'}
                  </button>
                </div>
              </label>
              {codeError && <p className="access-card__error">{codeError}</p>}
            </div>
          </div>
        </section>

        <section className="plans-panel__bitcoin">
          <span className="plans-panel__bitcoin-icon" aria-hidden="true">₿</span>
          <div>
            <strong>Same Bitcoin wallet for all tiers</strong>
            <p>
              Each payment uses a unique exact BTC amount so your tier unlocks automatically.
              Tips and subscriptions share the wallet — tiers are detected by amount + confirmation.
            </p>
          </div>
        </section>

        <section className="plans-panel__donate plans-panel__donate--top">
          <div className="donate-card donate-card--hero">
            <div className="donate-card__content">
              <span className="donate-card__icon">₿</span>
              <h3 className="donate-card__title">Tips keep FLUXGRID free</h3>
              <p className="donate-card__text">
                Optional Bitcoin tips — separate from tier payments.
              </p>
              <div className="donate-card__amounts">
                {donationAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`donate-card__amount ${selectedDonation === amt && !customAmount ? 'donate-card__amount--active' : ''}`}
                    onClick={() => {
                      setSelectedDonation(amt);
                      setCustomAmount('');
                    }}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="donate-card__cta donate-card__cta--hero"
                onClick={() => validTip && onDonate?.(tipAmount)}
                disabled={!validTip}
              >
                TIP ${validTip ? tipAmount : '—'} IN BITCOIN →
              </button>
            </div>
          </div>
        </section>

        <section className="plans-panel__section">
          <h3 className="plans-panel__section-title">
            {tier === 'void' ? 'Free tier' : 'Included in your plan'}
          </h3>
          <article className={`plan-card plan-card--cyan ${tier === 'void' ? 'plan-card--active-launch' : ''}`}>
            <span className="plan-card__badge plan-card__badge--live">VOID · FREE</span>
            <div className="plan-card__head">
              <h4 className="plan-card__name">{freeTier.name}</h4>
              <div className="plan-card__price">
                <span className="plan-card__amount">{freeTier.price}</span>
                <span className="plan-card__period">{freeTier.period}</span>
              </div>
            </div>
            <ul className="plan-card__features">
              {freeTier.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="plans-panel__section">
          <h3 className="plans-panel__section-title">{paidSectionTitle}</h3>
          <div className="plans-grid">
            {paidTiers.map((plan) => {
              const isActive = tier === plan.id;
              return (
                <article
                  key={plan.id}
                  className={`plan-card plan-card--${plan.id === 'signal' ? 'magenta' : plan.id === 'pulse' ? 'violet' : 'lime'} ${plan.featured ? 'plan-card--featured-flux' : ''} ${isActive ? 'plan-card--active-launch' : ''}`}
                >
                  <span className={`plan-card__badge ${isActive ? 'plan-card__badge--live' : plan.featured ? 'plan-card__badge--flux' : ''}`}>
                    {isActive ? '● ACTIVE' : plan.featured ? 'BEST' : 'PAID'}
                  </span>
                  <div className="plan-card__head">
                    <h4 className="plan-card__name">{plan.name}</h4>
                    <div className="plan-card__price">
                      <span className="plan-card__amount">{plan.price}</span>
                      <span className="plan-card__period">{plan.period}</span>
                      <span className="plan-card__btc">{paymentBadge}</span>
                    </div>
                    <p className="plan-card__tagline">{plan.tagline}</p>
                  </div>
                  <ul className="plan-card__features">
                    {plan.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  {isActive ? (
                    <div className="plan-card__cta plan-card__cta--active">YOUR ACTIVE TIER</div>
                  ) : (
                    <button
                      type="button"
                      className={`plan-card__cta plan-card__cta--buy ${plan.featured ? 'plan-card__cta--flux' : ''}`}
                      onClick={() => onBuyTier?.(plan.id, plan.priceUsd, plan.name)}
                    >
                      GET {plan.name} — {plan.price} →
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <footer className="plans-panel__footer">
          <p>
            No accounts. No emails. Your access key is your only credential — copy it after payment and store it safely.
            Lose the key = lose your tier. Max {maxDevices} devices per key — disconnect sessions in Your access if needed.
          </p>
        </footer>
      </div>
    </div>
  );
}