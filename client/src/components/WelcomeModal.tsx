import { useI18n } from '../i18n/context';
import './Onboarding.css';

interface WelcomeModalProps {
  onContinue: () => void;
}

export function WelcomeModal({ onContinue }: WelcomeModalProps) {
  const { t, tList } = useI18n();

  return (
    <div className="onboarding-overlay">
      <div className="welcome-modal">
        <header className="welcome-modal__header">
          <h2 className="welcome-modal__title">{t('welcomeTitle')}</h2>
          <p className="welcome-modal__note">{t('welcomeLegalNote')}</p>
        </header>

        <div className="welcome-modal__sections">
          <section className="welcome-section welcome-section--channel">
            <h3 className="welcome-section__title">◎ {t('welcomeChannelTitle')}</h3>
            <p className="welcome-section__text">{t('welcomeChannelText')}</p>
            <ul className="welcome-section__list">
              {tList('welcomeChannelItems').map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="welcome-section welcome-section--vpn">
            <h3 className="welcome-section__title">◈ {t('welcomeVpnTitle')}</h3>
            <p className="welcome-section__text">{t('welcomeVpnText')}</p>
          </section>

          <section className="welcome-section welcome-section--collect">
            <h3 className="welcome-section__title">+ {t('welcomeCollectTitle')}</h3>
            <ul className="welcome-section__list">
              {tList('welcomeCollectItems').map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="welcome-section welcome-section--nocollect">
            <h3 className="welcome-section__title">− {t('welcomeNoCollectTitle')}</h3>
            <ul className="welcome-section__list">
              {tList('welcomeNoCollectItems').map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="welcome-section welcome-section--free">
            <h3 className="welcome-section__title">♡ {t('welcomeFreeTitle')}</h3>
            <p className="welcome-section__text">{t('welcomeFreeText')}</p>
          </section>

          <section className="welcome-section welcome-section--illegal">
            <h3 className="welcome-section__title">⚠ {t('welcomeIllegalTitle')}</h3>
            <p className="welcome-section__text">{t('welcomeIllegalText')}</p>
          </section>

          <section className="welcome-section welcome-section--media">
            <h3 className="welcome-section__title">◆ {t('welcomeMediaTitle')}</h3>
            <p className="welcome-section__text">{t('welcomeMediaText')}</p>
          </section>

          <p className="welcome-modal__pii">{t('welcomePii')}</p>
        </div>

        <button type="button" className="welcome-modal__enter" onClick={onContinue}>
          {t('welcomeEnter')}
        </button>
      </div>
    </div>
  );
}