import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from 'i18next';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (lang: string) => void;
  supportedLanguages: { code: string; name: string }[];
}

const defaultLanguages = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
];

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: 'en',
  changeLanguage: () => {},
  supportedLanguages: defaultLanguages,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');
  
  // Initialize language detection once when the provider mounts
  useEffect(() => {
    // Check localStorage first
    const savedLanguage = localStorage.getItem('i18nextLng');
    
    if (savedLanguage) {
      // If language is already saved, use it
      i18n.changeLanguage(savedLanguage);
    } else {
      // Otherwise detect from browser
      const browserLang = navigator.language.split('-')[0];
      // Check if browser language is supported
      const isSupported = defaultLanguages.some(lang => lang.code === browserLang);
      // If browser language is supported, use it. Otherwise fall back to default (en)
      const langToUse = isSupported ? browserLang : 'en';
      i18n.changeLanguage(langToUse);
    }
  }, []);
  
  // Set up listener for language changes
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setCurrentLanguage(lng);
      document.documentElement.lang = lng;
      localStorage.setItem('i18nextLng', lng);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  // Make sure document language is set correctly
  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        supportedLanguages: defaultLanguages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
