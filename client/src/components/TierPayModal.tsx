import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useI18n } from '../i18n/context';
import {
  createStripeTierCheckout,
  createTierInvoice,
  fetchTipRates,
  pollTierPaymentStatus,
  type TierInvoice,
} from '../api';
import type { TierId } from '../tiers/tiers';
import { useTier } from '../tiers/context';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { getStoredAffiliateRef } from '../utils/refCapture';
import { getRewardfulReferral, waitForRewardfulReady } from '../utils/rewardful';
import './TipModal.css';

type PaymentMethod = 'stripe' | 'bitcoin';

interface TierPayModalProps {
  open: boolean;
  tierId: TierId;
  tierName: string;
  priceUsd: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TierPayModal({
  open,
  tierId,
  tierName,
  priceUsd,
  onClose,
  onSuccess,
}: TierPayModalProps) {
  const { t, tList } = useI18n();
  const { applyAccessCode } = useTier();
  const methods = usePaymentMethods(open);
  const [invoice, setInvoice] = useState<TierInvoice | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [copied, setCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  const reset = useCallback(() => {
    setInvoice(null);
    setQrDataUrl('');
    setError('');
    setPaid(false);
    setAccessCode('');
    setExpiresAt('');
    setCopied(false);
    setPaymentMethod(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    reset();
  }, [open, reset, tierId]);

  useEffect(() => {
    if (!invoice || paid || invoice.mode === 'stripe') return;
    const interval = setInterval(async () => {
      try {
        const status = await pollTierPaymentStatus(invoice.subscriptionId);
        if (status.paid && status.accessCode) {
          setPaid(true);
          setAccessCode(status.accessCode);
          setExpiresAt(status.expiresAt ?? '');
          await applyAccessCode(status.accessCode);
          onSuccess?.();
        }
      } catch {
        /* ignore poll errors */
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [invoice, paid, applyAccessCode, onSuccess]);

  if (!open) return null;

  const handleBitcoinPay = async () => {
    if (!methods.bitcoin) {
      setError(t('tierPayBtcUnavailable'));
      return;
    }
    setPaymentMethod('bitcoin');
    setLoading(true);
    setError('');
    try {
      await fetchTipRates();
      const inv = await createTierInvoice(tierId, 'USD');
      setInvoice(inv);
      const qrTarget =
        inv.mode === 'btcpay' && inv.checkoutUrl
          ? inv.checkoutUrl
          : inv.paymentUri || `bitcoin:${inv.address}?amount=${inv.amountBtc}`;
      const qr = await QRCode.toDataURL(qrTarget, {
        width: 220,
        margin: 2,
        color: { dark: '#00f0ff', light: '#0a0a12' },
      });
      setQrDataUrl(qr);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setPaymentMethod(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCardPay = async () => {
    if (!methods.stripe) {
      setError(t('tierPayCardUnavailable'));
      return;
    }
    setPaymentMethod('stripe');
    setLoading(true);
    setError('');
    try {
      await waitForRewardfulReady();
      const inv = await createStripeTierCheckout(tierId, 'USD', {
        referral: getRewardfulReferral(),
        affiliateRef: getStoredAffiliateRef(),
      });
      if (!inv.checkoutUrl) throw new Error('Stripe checkout unavailable');
      window.location.href = inv.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Card checkout failed');
      setPaymentMethod(null);
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!accessCode) return;
    await navigator.clipboard.writeText(accessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showMethodPicker = !invoice && !paid && paymentMethod === null;
  const showBackToMethods = paymentMethod !== null && !invoice && !paid && !loading;

  return (
    <div className="tip-overlay" onClick={onClose}>
      <div className="tip-modal tip-modal--tier tip-modal--checkout" onClick={(e) => e.stopPropagation()} role="dialog">
        <header className="tip-modal__header">
          <span className="tip-modal__eyebrow">{t('tierPayEyebrow')}</span>
          <h2>{tierName} — ${priceUsd}/mo</h2>
          <p className="tip-modal__anon-note">{t('tierPayIntro')}</p>
          <button type="button" className="tip-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        {showMethodPicker && (
          <div className="tip-modal__body">
            <h3 className="tip-modal__checkout-heading">{t('tierCheckoutTitle')}</h3>
            <ul className="tip-modal__checkout-list">
              {tList('tierCheckoutItems').map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="tip-modal__method-label">{t('tierPayChooseMethod')}</p>
            <div className="tip-modal__methods">
              <button
                type="button"
                className={`tip-modal__method tip-modal__method--card ${!methods.stripe ? 'tip-modal__method--dim' : ''}`}
                onClick={handleCardPay}
                disabled={loading}
              >
                <span className="tip-modal__method-title">{t('tierPayCardTitle')}</span>
                <span className="tip-modal__method-desc">
                  {methods.stripe ? t('tierPayCardDesc') : t('tierPayCardPending')}
                </span>
              </button>
              <button
                type="button"
                className={`tip-modal__method tip-modal__method--btc ${!methods.bitcoin ? 'tip-modal__method--dim' : ''}`}
                onClick={handleBitcoinPay}
                disabled={loading}
              >
                <span className="tip-modal__method-title">{t('tierPayBtcTitle')}</span>
                <span className="tip-modal__method-desc">{t('tierPayBtcDesc')}</span>
              </button>
            </div>
            {error && <p className="tip-modal__error">{error}</p>}
          </div>
        )}

        {showBackToMethods && (
          <div className="tip-modal__body">
            {error && <p className="tip-modal__error">{error}</p>}
            <button type="button" className="tip-modal__back" onClick={() => { setPaymentMethod(null); setError(''); }}>
              ← {t('tierPayChooseMethod')}
            </button>
          </div>
        )}

        {invoice && invoice.mode !== 'stripe' && !paid && (
          <div className="tip-modal__body">
            <button type="button" className="tip-modal__back" onClick={reset}>
              ← {t('tierPayChooseMethod')}
            </button>
            <p className="tip-modal__amount">
              {t('tierPayExactBtc')}: <strong>{invoice.amountBtc} BTC</strong>
            </p>
            <p className="tip-modal__exact-warning">{t('tipExactAmount')}</p>
            {qrDataUrl && <img src={qrDataUrl} alt="Bitcoin QR" className="tip-modal__qr" />}
            {invoice.address && <code className="tip-modal__address">{invoice.address}</code>}
            {invoice.mode === 'btcpay' && invoice.checkoutUrl && (
              <a href={invoice.checkoutUrl} target="_blank" rel="noreferrer" className="tip-modal__checkout">
                Open BTCPay checkout →
              </a>
            )}
            <h3 className="tip-modal__checkout-heading">{t('tierPayDuringTitle')}</h3>
            <ul className="tip-modal__checkout-list tip-modal__checkout-list--compact">
              {tList('tierPayDuringItems').map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="tip-modal__waiting">{t('tierPayWatching')}</p>
          </div>
        )}

        {paid && accessCode && (
          <div className="tip-modal__body tip-modal__body--success">
            <span className="tip-modal__success-icon">◈</span>
            <h3>{tierName} ACTIVATED</h3>
            <h4 className="tip-modal__checkout-heading tip-modal__checkout-heading--warn">{t('tierPaySuccessTitle')}</h4>
            <ul className="tip-modal__checkout-list tip-modal__checkout-list--warn">
              {tList('tierPaySuccessWarnings').map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <code className="tip-modal__access-code">{accessCode}</code>
            <button type="button" className="tip-modal__copy" onClick={copyCode}>
              {copied ? t('tierPayCopied') : t('tierPayCopyKey')}
            </button>
            {expiresAt && (
              <p className="tip-modal__expires">Active until {new Date(expiresAt).toLocaleDateString()}</p>
            )}
            <p className="tip-modal__hint">{t('tierPayActivated')}</p>
          </div>
        )}
      </div>
    </div>
  );
}