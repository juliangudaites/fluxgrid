import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useI18n } from '../i18n/context';
import {
  createTipInvoice,
  fetchTipConfig,
  fetchTipRates,
  pollTipStatus,
  type TipConfig,
  type TipInvoice,
  type TipRates,
} from '../api';
import './TipModal.css';

interface TipModalProps {
  open: boolean;
  initialAmountUsd?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESETS_USD = [3, 7, 15, 25];

export function TipModal({ open, initialAmountUsd, onClose, onSuccess }: TipModalProps) {
  const { t } = useI18n();
  const [config, setConfig] = useState<TipConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState('');
  const [rates, setRates] = useState<TipRates | null>(null);
  const [currency, setCurrency] = useState<'USD' | 'BRL'>('USD');
  const [amount, setAmount] = useState('');
  const [invoice, setInvoice] = useState<TipInvoice | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState<'address' | 'uri' | null>(null);

  const reset = useCallback(() => {
    setInvoice(null);
    setQrDataUrl('');
    setError('');
    setPaid(false);
    setCopied(null);
    setAmount(initialAmountUsd ? String(initialAmountUsd) : '7');
  }, [initialAmountUsd]);

  useEffect(() => {
    if (!open) return;
    reset();
    setConfigLoading(true);
    setConfigError('');
    void Promise.all([fetchTipConfig(), fetchTipRates()])
      .then(([cfg, r]) => {
        setConfig(cfg);
        setRates(r);
      })
      .catch((err) => setConfigError(err instanceof Error ? err.message : t('tipLoadError')))
      .finally(() => setConfigLoading(false));
  }, [open, reset, t]);

  useEffect(() => {
    if (!invoice || invoice.mode !== 'btcpay' || paid) return;
    const interval = setInterval(async () => {
      try {
        const status = await pollTipStatus(invoice.tipId);
        if (status.paid) {
          setPaid(true);
          onSuccess?.();
        }
      } catch {
        /* ignore poll errors */
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [invoice, paid, onSuccess]);

  if (!open) return null;

  const numAmount = Number(amount);
  const validAmount =
    currency === 'USD'
      ? numAmount >= 1 && numAmount <= 5000
      : numAmount >= 5 && numAmount <= 25000;

  const btcPreview = rates
    ? currency === 'USD'
      ? numAmount / rates.usd
      : numAmount / rates.brl
    : 0;

  const handleGenerate = async () => {
    if (!validAmount) {
      setError(t('tipInvalidAmount'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const body =
        currency === 'USD' ? { amountUsd: numAmount } : { amountBrl: numAmount };
      const inv = await createTipInvoice(body);
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
      setError(err instanceof Error ? err.message : t('tipError'));
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text: string, kind: 'address' | 'uri') => {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  };

  if (configLoading) {
    return (
      <div className="tip-overlay" onClick={onClose}>
        <div className="tip-modal" onClick={(e) => e.stopPropagation()}>
          <header className="tip-modal__header">
            <h2>{t('tipTitle')}</h2>
            <button type="button" className="tip-modal__close" onClick={onClose}>×</button>
          </header>
          <p className="tip-modal__setup">{t('tipLoading')}</p>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="tip-overlay" onClick={onClose}>
        <div className="tip-modal" onClick={(e) => e.stopPropagation()}>
          <header className="tip-modal__header">
            <h2>{t('tipTitle')}</h2>
            <button type="button" className="tip-modal__close" onClick={onClose}>×</button>
          </header>
          <p className="tip-modal__error">{configError}</p>
          <button
            type="button"
            className="tip-modal__generate"
            onClick={() => {
              setConfigLoading(true);
              setConfigError('');
              void Promise.all([fetchTipConfig(), fetchTipRates()])
                .then(([cfg, r]) => { setConfig(cfg); setRates(r); })
                .catch((err) => setConfigError(err instanceof Error ? err.message : t('tipLoadError')))
                .finally(() => setConfigLoading(false));
            }}
          >
            {t('tipRetry')}
          </button>
        </div>
      </div>
    );
  }

  if (!config?.enabled) {
    return (
      <div className="tip-overlay" onClick={onClose}>
        <div className="tip-modal" onClick={(e) => e.stopPropagation()}>
          <header className="tip-modal__header">
            <h2>{t('tipTitle')}</h2>
            <button type="button" className="tip-modal__close" onClick={onClose}>×</button>
          </header>
          <p className="tip-modal__setup">{t('tipNotConfigured')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tip-overlay" onClick={onClose}>
      <div className="tip-modal" onClick={(e) => e.stopPropagation()} role="dialog">
        <header className="tip-modal__header">
          <span className="tip-modal__btc" aria-hidden="true">₿</span>
          <div>
            <h2>{t('tipTitle')}</h2>
            <p>{t('tipSubtitle')}</p>
          </div>
          <button type="button" className="tip-modal__close" onClick={onClose} aria-label="Close">×</button>
        </header>

        {paid ? (
          <div className="tip-modal__success">
            <span className="tip-modal__success-icon">✓</span>
            <h3>{t('tipThankYou')}</h3>
            <p>{t('tipThankYouText')}</p>
            <button type="button" className="tip-modal__done" onClick={onClose}>{t('tipClose')}</button>
          </div>
        ) : !invoice ? (
          <>
            <div className="tip-modal__currency">
              <button
                type="button"
                className={currency === 'USD' ? 'tip-modal__cur tip-modal__cur--active' : 'tip-modal__cur'}
                onClick={() => setCurrency('USD')}
              >
                USD $
              </button>
              <button
                type="button"
                className={currency === 'BRL' ? 'tip-modal__cur tip-modal__cur--active' : 'tip-modal__cur'}
                onClick={() => setCurrency('BRL')}
              >
                BRL R$
              </button>
            </div>

            <div className="tip-modal__presets">
              {PRESETS_USD.map((preset) => {
                const display =
                  currency === 'USD' ? preset : Math.round(preset * (rates?.brl ?? 520) / (rates?.usd ?? 95));
                return (
                  <button
                    key={preset}
                    type="button"
                    className={`tip-modal__preset ${Number(amount) === display ? 'tip-modal__preset--active' : ''}`}
                    onClick={() => setAmount(String(display))}
                  >
                    {currency === 'USD' ? `$${preset}` : `R$${display}`}
                  </button>
                );
              })}
            </div>

            <label className="tip-modal__custom">
              <span>{t('tipCustomAmount')}</span>
              <div className="tip-modal__custom-row">
                <span className="tip-modal__symbol">{currency === 'USD' ? '$' : 'R$'}</span>
                <input
                  type="number"
                  min={currency === 'USD' ? 1 : 5}
                  max={currency === 'USD' ? 5000 : 25000}
                  step={currency === 'USD' ? 0.5 : 1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={currency === 'USD' ? '7' : '35'}
                />
              </div>
              {rates && validAmount && (
                <small className="tip-modal__preview">
                  ≈ {btcPreview.toFixed(8)} BTC
                  {currency === 'USD' && rates.brl
                    ? ` · R$${((numAmount / rates.usd) * rates.brl).toFixed(2)}`
                    : rates.usd
                      ? ` · $${((numAmount / rates.brl) * rates.usd).toFixed(2)}`
                      : ''}
                </small>
              )}
            </label>

            {error && <p className="tip-modal__error">{error}</p>}

            <button
              type="button"
              className="tip-modal__generate"
              onClick={handleGenerate}
              disabled={loading || !validAmount}
            >
              {loading ? t('tipGenerating') : t('tipGenerate')}
            </button>

            <p className="tip-modal__note">{t('tipAnonymous')}</p>
          </>
        ) : (
          <div className="tip-modal__payment">
            <div className="tip-modal__amounts">
              <div>
                <span>{t('tipYouSend')}</span>
                <strong>{invoice.amountBtc} BTC</strong>
              </div>
              <div>
                <span>≈</span>
                <strong>${invoice.amountUsd.toFixed(2)} · R${invoice.amountBrl.toFixed(2)}</strong>
              </div>
            </div>

            {qrDataUrl && (
              <img src={qrDataUrl} alt="Bitcoin payment QR" className="tip-modal__qr" />
            )}

            {invoice.mode === 'btcpay' && invoice.checkoutUrl ? (
              <>
                <a
                  href={invoice.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="tip-modal__pay-link"
                >
                  {t('tipOpenWallet')}
                </a>
                <p className="tip-modal__waiting">{t('tipWaitingPayment')}</p>
              </>
            ) : (
              <>
                <div className="tip-modal__address-box">
                  <code>{invoice.address}</code>
                  <button type="button" onClick={() => copyText(invoice.address!, 'address')}>
                    {copied === 'address' ? t('tipCopied') : t('tipCopyAddress')}
                  </button>
                </div>
                {invoice.paymentUri && (
                  <div className="tip-modal__actions">
                    <a href={invoice.paymentUri} className="tip-modal__pay-link">
                      {t('tipOpenWallet')}
                    </a>
                    <button
                      type="button"
                      onClick={() => copyText(invoice.paymentUri!, 'uri')}
                    >
                      {copied === 'uri' ? t('tipCopied') : t('tipCopyUri')}
                    </button>
                  </div>
                )}
                <p className="tip-modal__exact">{t('tipExactAmount')}</p>
              </>
            )}

            <button type="button" className="tip-modal__back" onClick={reset}>
              {t('tipChangeAmount')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}