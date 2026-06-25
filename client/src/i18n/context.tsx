import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { translations, type Lang, type TranslationKey } from './translations';

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  tList: (
    key:
      | 'welcomeCollectItems'
      | 'welcomeNoCollectItems'
      | 'welcomeChannelItems'
      | 'anonWarningItems'
      | 'tierCheckoutItems'
      | 'tierPayDuringItems'
      | 'tierPaySuccessWarnings'
  ) => readonly string[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'fluxgrid_lang';

function getInitialLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'pt' || stored === 'en') return stored;
  const browser = navigator.language.toLowerCase();
  return browser.startsWith('pt') ? 'pt' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[lang][key] as string,
    [lang]
  );

  const tList = useCallback(
    (
      key:
        | 'welcomeCollectItems'
        | 'welcomeNoCollectItems'
        | 'welcomeChannelItems'
        | 'anonWarningItems'
        | 'tierCheckoutItems'
        | 'tierPayDuringItems'
        | 'tierPaySuccessWarnings'
    ) => translations[lang][key],
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t, tList }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}