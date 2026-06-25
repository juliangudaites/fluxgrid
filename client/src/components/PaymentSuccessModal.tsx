import { useState } from 'react';
import { useI18n } from '../i18n/context';
import './TipModal.css';

interface PaymentSuccessModalProps {
  open: boolean;
  tierName: string;
  accessCode: string;
  expiresAt?: string;
  onClose: () => void;
}

export function PaymentSuccessModal({
  open,
  tierName,
  accessCode,
  expiresAt,
  onClose,
}: PaymentSuccessModalProps) {
  const { t, tList } = useI18n();
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const copyCode = async () => {
    await navigator.clipboard.writeText(accessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tip-overlay" onClick={onClose}>
      <div className="tip-modal tip-modal--tier tip-modal--checkout" onClick={(e) => e.stopPropagation()} role="dialog">
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
          <button type="button" className="tip-modal__cta" onClick={onClose}>
            {t('paymentSuccessContinue')}
          </button>
        </div>
      </div>
    </div>
  );
}