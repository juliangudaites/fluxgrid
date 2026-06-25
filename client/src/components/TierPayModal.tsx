import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useI18n } from '../i18n/context';
import { createTierInvoice, fetchTipRates, pollTierPaymentStatus, type TierInvoice } from '../api';
import type { TierId } from '../tiers/tiers';
import { useTier } from '../tiers/context';
import './TipModal.css';

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
  const { applyAccessCode, maxDevices } = useTier();
  const [invoice, setInvoice] = useState<TierInvoice | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [copied, setCopied] = useState(false);

  const reset = useCallback(() => {
    setInvoice(null);
    setQrDataUrl('');
    setError('');
    setPaid(false);
    setAccessCode('');
    setExpiresAt('');
    setCopied(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    reset();
  }, [open, reset, tierId]);

  useEffect(() => {
    if (!invoice || paid) return;
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

  const handlePay = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!accessCode) return;
    await navigator.clipboard.writeText(accessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tip-overlay" onClick={onClose}>
      <div className="tip-modal tip-modal--tier tip-modal--checkout" onClick={(e) => e.stopPropagation()} role="dialog">
        <header className="tip-modal__header">
          <span className="tip-modal__eyebrow">₿ ANONYMOUS ACCESS · NO ACCOUNT</span>
          <h2>{tierName} — ${priceUsd}/mo</h2>
          <p className="tip-modal__anon-note">
            Pay Bitcoin to our wallet. You receive a private <strong>access key</strong> — your only credential.
            Max <strong>{maxDevices} devices</strong> per key. No email, no username, no recovery if lost.
          </p>
          <button type="button" className="tip-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        {!invoice && !paid && (
          <div className="tip-modal__body">
            <h3 className="tip-modal__checkout-heading">{t('tierCheckoutTitle')}</h3>
            <ul className="tip-modal__checkout-list">
              {tList('tierCheckoutItems').map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {error && <p className="tip-modal__error">{error}</p>}
            <button type="button" className="tip-modal__cta" onClick={handlePay} disabled={loading}>
              {loading ? t('tipGenerating') : t('tierPayGenerate')}
            </button>
          </div>
        )}

        {invoice && !paid && (
          <div className="tip-modal__body">
            <p className="tip-modal__amount">
              {t('tierPayExactBtc')}: <strong>{invoice.amountBtc} BTC</strong>
            </p>
            <p className="tip-modal__exact-warning">
              {t('tipExactAmount')}
            </p>
            {qrDataUrl && <img src={qrDataUrl} alt="Bitcoin QR" className="tip-modal__qr" />}
            {invoice.address && (
              <code className="tip-modal__address">{invoice.address}</code>
            )}
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