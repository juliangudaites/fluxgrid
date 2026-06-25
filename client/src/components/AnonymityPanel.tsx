import { useI18n } from '../i18n/context';
import './AnonymityPanel.css';

interface AnonymityPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AnonymityPanel({ open, onClose }: AnonymityPanelProps) {
  const { t, tList } = useI18n();

  if (!open) return null;

  const points = [
    { icon: '⊘', title: t('anonNoIdentityTitle'), text: t('anonNoIdentityText') },
    { icon: '◎', title: t('anonChannelTitle'), text: t('anonChannelText') },
    { icon: '▽', title: t('anonVoidLineTitle'), text: t('anonVoidLineText') },
    { icon: '⇄', title: t('anonNoLinkTitle'), text: t('anonNoLinkText') },
    { icon: '⬡', title: t('anonHandoffTitle'), text: t('anonHandoffText') },
    { icon: '₿', title: t('anonBitcoinTitle'), text: t('anonBitcoinText') },
    { icon: '◈', title: t('anonFluxTitle'), text: t('anonFluxText') },
    { icon: '⚠', title: t('anonGuardTitle'), text: t('anonGuardText') },
  ];

  return (
    <div className="anonymity-overlay" onClick={onClose}>
      <aside
        className="anonymity-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="anonymity-title"
      >
        <header className="anonymity-panel__header">
          <h2 id="anonymity-title" className="anonymity-panel__title">
            {t('anonPanelTitle')}
          </h2>
          <button type="button" className="anonymity-panel__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <p className="anonymity-panel__intro">{t('anonIntro')}</p>

        <div className="anonymity-panel__flux-callout">
          <strong>{t('anonFluxCalloutTitle')}</strong> — {t('anonFluxCalloutText')}
        </div>

        <div className="anonymity-panel__warning" role="alert">
          <strong>{t('anonWarningTitle')}</strong>
          <p>{t('anonWarningText')}</p>
          <ul>
            {tList('anonWarningItems').map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <ul className="anonymity-panel__list">
          {points.map((point) => (
            <li key={point.title} className="anonymity-panel__item">
              <span className="anonymity-panel__icon" aria-hidden="true">{point.icon}</span>
              <div>
                <h3 className="anonymity-panel__item-title">{point.title}</h3>
                <p className="anonymity-panel__item-text">{point.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <footer className="anonymity-panel__footer">
          <span className="anonymity-panel__launch">{t('anonFooterLaunch')}</span>
          <span className="anonymity-panel__tagline">{t('anonFooterTagline')}</span>
        </footer>
      </aside>
    </div>
  );
}