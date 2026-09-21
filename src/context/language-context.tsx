import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAppLanguage, setAppLanguage as saveAppLanguage, subscribeToDbChange } from '@/lib/db';
import { translations, SupportedLanguage } from '@/constants/translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string, defaultText?: string) => defaultText || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    setLanguageState(getAppLanguage());
    const unsubscribe = subscribeToDbChange(() => {
      setLanguageState(getAppLanguage());
    });
    return () => unsubscribe();
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    saveAppLanguage(lang);
  };

  const t = (key: string, defaultText?: string): string => {
    const langDict = translations[language] || translations.en;
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English dictionary
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
