import { useState } from 'react';
import { useI18n } from '../i18n/context';
import './Onboarding.css';

interface AgeGateProps {
  onVerified: () => void;
}

export function AgeGate({ onVerified }: AgeGateProps) {
  const { t } = useI18n();
  const [blocked, setBlocked] = useState(false);

  if (blocked) {
    return (
      <div className="onboarding-overlay">
        <div className="onboarding-card onboarding-card--blocked">
          <span className="onboarding-card__icon">⊘</span>
          <h2 className="onboarding-card__title">{t('ageBlockedTitle')}</h2>
          <p className="onboarding-card__text">{t('ageBlockedText')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <span className="onboarding-card__eyebrow">FLUXGRID · 2026</span>
        <h2 className="onboarding-card__title">{t('ageTitle')}</h2>
        <p className="onboarding-card__text">{t('ageSubtitle')}</p>
        <div className="onboarding-card__actions">
          <button
            type="button"
            className="onboarding-card__btn onboarding-card__btn--primary"
            onClick={onVerified}
          >
            {t('ageYes')}
          </button>
          <button
            type="button"
            className="onboarding-card__btn onboarding-card__btn--ghost"
            onClick={() => setBlocked(true)}
          >
            {t('ageNo')}
          </button>
        </div>
      </div>
    </div>
  );
}