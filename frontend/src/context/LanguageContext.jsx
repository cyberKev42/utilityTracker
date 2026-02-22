import { createContext, useState, useCallback, useEffect } from 'react';
import i18n from '../i18n/i18n';

export const LanguageContext = createContext(null);

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
];

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(i18n.language?.substring(0, 2) || 'en');

  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setLanguage(lng.substring(0, 2));
    };
    i18n.on('languageChanged', handleLanguageChanged);
    return () => i18n.off('languageChanged', handleLanguageChanged);
  }, []);

  const changeLanguage = useCallback((lng) => {
    i18n.changeLanguage(lng);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}
