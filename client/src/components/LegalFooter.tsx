import { useI18n } from '../i18n/context';
import type { LegalDocType } from './LegalPanel';
import './LegalFooter.css';

interface LegalFooterProps {
  onOpenLegal: (doc: LegalDocType) => void;
}

export function LegalFooter({ onOpenLegal }: LegalFooterProps) {
  const { t } = useI18n();

  return (
    <footer className="legal-footer">
      <nav className="legal-footer__nav" aria-label="Legal">
        <button type="button" onClick={() => onOpenLegal('terms')}>{t('footerTerms')}</button>
        <span className="legal-footer__sep">·</span>
        <button type="button" onClick={() => onOpenLegal('privacy')}>{t('footerPrivacy')}</button>
        <span className="legal-footer__sep">·</span>
        <button type="button" onClick={() => onOpenLegal('aup')}>{t('footerAup')}</button>
        <span className="legal-footer__sep">·</span>
        <button type="button" onClick={() => onOpenLegal('safety')}>{t('footerSafety')}</button>
      </nav>
      <p className="legal-footer__contact">{t('footerReport')}</p>
      <p className="legal-footer__contact">{t('footerLegal')}</p>
      <p className="legal-footer__operator">{t('footerOperator')}</p>
      <a href="/admin" className="legal-footer__host">Host portal</a>
    </footer>
  );
}