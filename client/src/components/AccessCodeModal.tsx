import { useState } from 'react';
import { useI18n } from '../i18n/context';
import { useTier } from '../tiers/context';
import './TipModal.css';

interface AccessCodeModalProps {
  open: boolean;
  onClose: () => void;
}

export function AccessCodeModal({ open, onClose }: AccessCodeModalProps) {
  const { t } = useI18n();
  const { applyAccessCode, caps, accessCode } = useTier();
  const [codeInput, setCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleApply = async () => {
    if (!codeInput.trim()) return;
    setLoading(true);
    setError('');
    try {
      await applyAccessCode(codeInput.trim());
      setCodeInput('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid access key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tip-overlay" onClick={onClose}>
      <div className="tip-modal tip-modal--tier" onClick={(e) => e.stopPropagation()} role="dialog">
        <header className="tip-modal__header">
          <span className="tip-modal__eyebrow">₿ PAID TIER ACCESS</span>
          <h2>{t('accessKeyTitle')}</h2>
          <p className="tip-modal__anon-note">{t('accessKeyHint')}</p>
          <button type="button" className="tip-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="tip-modal__body">
          {accessCode && (
            <p className="tip-modal__hint">
              Active: <strong>{caps.label}</strong> · <code className="tip-modal__access-code tip-modal__access-code--inline">{accessCode}</code>
            </p>
          )}
          <div className="access-code-entry">
            <input
              type="text"
              className="access-code-entry__input"
              placeholder={t('accessKeyPlaceholder')}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              spellCheck={false}
              autoComplete="off"
            />
            <button type="button" className="tip-modal__cta" onClick={handleApply} disabled={loading}>
              {loading ? '…' : t('accessKeyApply')}
            </button>
          </div>
          {error && <p className="tip-modal__error">{error}</p>}
        </div>
      </div>
    </div>
  );
}