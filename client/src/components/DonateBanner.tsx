import { useI18n } from '../i18n/context';
import './DonateBanner.css';

interface DonateBannerProps {
  onSupport: () => void;
  compact?: boolean;
}

export function DonateBanner({ onSupport, compact = false }: DonateBannerProps) {
  const { t } = useI18n();

  return (
    <aside className={`donate-banner ${compact ? 'donate-banner--compact' : ''}`}>
      <div className="donate-banner__glow" aria-hidden="true" />
      <div className="donate-banner__content">
        <span className="donate-banner__icon donate-banner__icon--btc" aria-hidden="true">₿</span>
        <div className="donate-banner__text">
          <strong>{t('donateBannerTitle')}</strong>
          <p>{t('donateBannerText')}</p>
        </div>
      </div>
      <button type="button" className="donate-banner__cta" onClick={onSupport}>
        {t('donateBannerCta')}
      </button>
    </aside>
  );
}