import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize language detection once when the provider mounts
  useEffect(() => {
    // First check if there's a language in the URL
    const pathParts = location.pathname.split('/');
    const urlLang = pathParts[1];
    const supportedLangCodes = defaultLanguages.map(l => l.code);
    
    if (urlLang && supportedLangCodes.includes(urlLang)) {
      // If URL has a valid language, use it
      if (urlLang !== currentLanguage) {
        i18n.changeLanguage(urlLang);
      }
    } else {
      // Check localStorage first
      const savedLanguage = localStorage.getItem('i18nextLng');
      
      if (savedLanguage && supportedLangCodes.includes(savedLanguage)) {
        // If language is already saved and supported, use it
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
    }
  }, [location.pathname, currentLanguage]);
  
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
    // Update i18n language
    i18n.changeLanguage(lang);
    
    // Update URL to reflect the new language
    const pathParts = location.pathname.split('/');
    const currentUrlLang = pathParts[1];
    const supportedLangCodes = defaultLanguages.map(l => l.code);
    
    if (supportedLangCodes.includes(currentUrlLang)) {
      // Replace the language part of the URL
      pathParts[1] = lang;
      const newPath = pathParts.join('/');
      navigate(newPath, { replace: true });
    } else {
      // No language in URL, add one
      const newPath = `/${lang}${location.pathname === '/' ? '/home' : location.pathname}`;
      navigate(newPath, { replace: true });
    }
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
