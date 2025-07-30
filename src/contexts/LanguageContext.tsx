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
      // Let i18n handle the language detection automatically
      // It will check localStorage first, then fall back to browser language
      const detectedLang = i18n.language;
      if (detectedLang && supportedLangCodes.includes(detectedLang)) {
        // If i18n detected a supported language, use it
        if (detectedLang !== currentLanguage) {
          i18n.changeLanguage(detectedLang);
        }
      } else {
        // Fall back to English if no valid language detected
        i18n.changeLanguage('en');
      }
    }
  }, [location.pathname, currentLanguage]);
  
  // Set up listener for language changes
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setCurrentLanguage(lng);
      document.documentElement.lang = lng;
      // i18n will automatically save to localStorage, so we don't need to do it manually
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
