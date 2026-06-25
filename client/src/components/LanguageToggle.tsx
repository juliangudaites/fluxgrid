import { useI18n } from '../i18n/context';
import './LanguageToggle.css';

export function LanguageToggle() {
  const { lang, setLang, t } = useI18n();

  return (
    <button
      type="button"
      className="lang-toggle"
      onClick={() => setLang(lang === 'en' ? 'pt' : 'en')}
      title={lang === 'en' ? 'Português' : 'English'}
      aria-label="Toggle language"
    >
      {t('langToggle')}
    </button>
  );
}